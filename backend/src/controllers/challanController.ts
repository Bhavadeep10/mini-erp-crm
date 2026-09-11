import { Response } from "express";
import { pool } from "../config/database";
import { AuthRequest } from "../middleware/authMiddleware";

export const createChallan = async (
  req: AuthRequest,
  res: Response
) => {
  const client = await pool.connect();

  try {
    const { customer_id, items } = req.body;

    if (!customer_id || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Customer and at least one product are required"
      });
    }

    await client.query("BEGIN");

    const customerResult = await client.query(
      "SELECT id FROM customers WHERE id = $1",
      [customer_id]
    );

    if (customerResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Customer not found"
      });
    }

    const challanNumber = `CH-${Date.now()}`;

    const challanResult = await client.query(
      `INSERT INTO sales_challans
       (challan_number, customer_id, status, created_by)
       VALUES ($1, $2, 'DRAFT', $3)
       RETURNING *`,
      [
        challanNumber,
        customer_id,
        req.user?.id || null
      ]
    );

    const challan = challanResult.rows[0];

    for (const item of items) {
      const productId = Number(item.product_id);
      const quantity = Number(item.quantity);

      if (
        !Number.isInteger(productId) ||
        !Number.isInteger(quantity) ||
        quantity <= 0
      ) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: "Invalid product or quantity"
        });
      }

      const productResult = await client.query(
        `SELECT id, name, sku, unit_price
         FROM products
         WHERE id = $1`,
        [productId]
      );

      if (productResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message: `Product ${productId} not found`
        });
      }

      const product = productResult.rows[0];

      await client.query(
        `INSERT INTO sales_challan_items
         (challan_id, product_id, product_name, sku, unit_price, quantity)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          challan.id,
          product.id,
          product.name,
          product.sku,
          product.unit_price,
          quantity
        ]
      );
    }

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Sales challan created successfully",
      challan: challan
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Create challan error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  } finally {
    client.release();
  }
};

export const getChallans = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const result = await pool.query(
      `SELECT
        sc.id,
        sc.challan_number,
        sc.customer_id,
        c.name AS customer_name,
        sc.status,
        sc.created_by,
        u.name AS created_by_name,
        sc.created_at,
        sc.confirmed_at
       FROM sales_challans sc
       JOIN customers c ON sc.customer_id = c.id
       LEFT JOIN users u ON sc.created_by = u.id
       ORDER BY sc.id DESC`
    );

    return res.json({
      challans: result.rows
    });
  } catch (error) {
    console.error("Get challans error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

export const getChallanById = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const challanId = Number(req.params.id);

    if (!Number.isInteger(challanId)) {
      return res.status(400).json({
        message: "Invalid challan ID"
      });
    }

    const challanResult = await pool.query(
      `SELECT
        sc.*,
        c.name AS customer_name,
        c.mobile AS customer_mobile,
        c.email AS customer_email,
        c.address AS customer_address,
        u.name AS created_by_name
       FROM sales_challans sc
       JOIN customers c ON sc.customer_id = c.id
       LEFT JOIN users u ON sc.created_by = u.id
       WHERE sc.id = $1`,
      [challanId]
    );

    if (challanResult.rows.length === 0) {
      return res.status(404).json({
        message: "Challan not found"
      });
    }

    const itemsResult = await pool.query(
      `SELECT *
       FROM sales_challan_items
       WHERE challan_id = $1
       ORDER BY id`,
      [challanId]
    );

    return res.json({
      challan: challanResult.rows[0],
      items: itemsResult.rows
    });
  } catch (error) {
    console.error("Get challan error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

export const confirmChallan = async (
  req: AuthRequest,
  res: Response
) => {
  const client = await pool.connect();

  try {
    const challanId = Number(req.params.id);

    if (!Number.isInteger(challanId)) {
      return res.status(400).json({
        message: "Invalid challan ID"
      });
    }

    await client.query("BEGIN");

    const challanResult = await client.query(
      `SELECT *
       FROM sales_challans
       WHERE id = $1
       FOR UPDATE`,
      [challanId]
    );

    if (challanResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Challan not found"
      });
    }

    const challan = challanResult.rows[0];

    if (challan.status !== "DRAFT") {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Only draft challans can be confirmed"
      });
    }

    const itemsResult = await client.query(
      `SELECT *
       FROM sales_challan_items
       WHERE challan_id = $1`,
      [challanId]
    );

    if (itemsResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Challan has no items"
      });
    }

    for (const item of itemsResult.rows) {
      const productResult = await client.query(
        `SELECT id, current_stock
         FROM products
         WHERE id = $1
         FOR UPDATE`,
        [item.product_id]
      );

      if (productResult.rows.length === 0) {
        await client.query("ROLLBACK");

        return res.status(404).json({
          message: `Product ${item.product_id} not found`
        });
      }

      const currentStock = Number(
        productResult.rows[0].current_stock
      );

      if (currentStock < Number(item.quantity)) {
        await client.query("ROLLBACK");

        return res.status(400).json({
          message: `Insufficient stock for ${item.product_name}`
        });
      }
    }

    for (const item of itemsResult.rows) {
      const quantity = Number(item.quantity);

      await client.query(
        `UPDATE products
         SET current_stock = current_stock - $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [quantity, item.product_id]
      );

      await client.query(
        `INSERT INTO stock_movements
         (product_id, movement_type, quantity, reason, created_by)
         VALUES ($1, 'OUT', $2, $3, $4)`,
        [
          item.product_id,
          quantity,
          `Sales challan ${challan.challan_number}`,
          req.user?.id || null
        ]
      );
    }

    const updatedChallan = await client.query(
      `UPDATE sales_challans
       SET status = 'CONFIRMED',
           confirmed_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [challanId]
    );

    await client.query("COMMIT");

    return res.json({
      message: "Sales challan confirmed successfully",
      challan: updatedChallan.rows[0]
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Confirm challan error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  } finally {
    client.release();
  }
};