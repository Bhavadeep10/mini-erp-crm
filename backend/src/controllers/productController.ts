import { Response } from "express";
import { pool } from "../config/database";
import { AuthRequest } from "../middleware/authMiddleware";

export const addProduct = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      sku,
      category,
      unit_price,
      current_stock,
      min_stock,
      warehouse_location
    } = req.body;

    if (!name || !sku || unit_price === undefined) {
      return res.status(400).json({
        message: "Name, SKU and unit price are required"
      });
    }

    if (Number(unit_price) < 0) {
      return res.status(400).json({
        message: "Unit price cannot be negative"
      });
    }

    if (Number(current_stock || 0) < 0 || Number(min_stock || 0) < 0) {
      return res.status(400).json({
        message: "Stock values cannot be negative"
      });
    }

    const existingProduct = await pool.query(
      "SELECT id FROM products WHERE sku = $1",
      [sku]
    );

    if (existingProduct.rows.length > 0) {
      return res.status(409).json({
        message: "SKU already exists"
      });
    }

    const result = await pool.query(
      `INSERT INTO products
       (name, sku, category, unit_price, current_stock, min_stock, warehouse_location)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        name,
        sku,
        category || null,
        Number(unit_price),
        Number(current_stock || 0),
        Number(min_stock || 0),
        warehouse_location || null
      ]
    );

    return res.status(201).json({
      message: "Product added successfully",
      product: result.rows[0]
    });
  } catch (error) {
    console.error("Add product error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

export const getProducts = async (req: AuthRequest, res: Response) => {
  try {
    const search = String(req.query.search || "");
    const category = String(req.query.category || "");

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      50
    );
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: (string | number)[] = [];

    if (search) {
      values.push(`%${search}%`);

      conditions.push(
        `(name ILIKE $${values.length}
        OR sku ILIKE $${values.length})`
      );
    }

    if (category) {
      values.push(category);
      conditions.push(`category = $${values.length}`);
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM products ${whereClause}`,
      values
    );

    values.push(limit);
    values.push(offset);

    const result = await pool.query(
      `SELECT *,
        CASE
          WHEN current_stock <= min_stock THEN true
          ELSE false
        END AS low_stock
       FROM products
       ${whereClause}
       ORDER BY id DESC
       LIMIT $${values.length - 1}
       OFFSET $${values.length}`,
      values
    );

    const total = Number(countResult.rows[0].count);

    return res.json({
      products: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get products error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

export const getProductById = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const productId = Number(req.params.id);

    if (!Number.isInteger(productId)) {
      return res.status(400).json({
        message: "Invalid product ID"
      });
    }

    const productResult = await pool.query(
      `SELECT *,
        CASE
          WHEN current_stock <= min_stock THEN true
          ELSE false
        END AS low_stock
       FROM products
       WHERE id = $1`,
      [productId]
    );

    if (productResult.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    const movementsResult = await pool.query(
      `SELECT
        sm.id,
        sm.movement_type,
        sm.quantity,
        sm.reason,
        sm.created_at,
        u.name AS created_by_name
       FROM stock_movements sm
       LEFT JOIN users u ON sm.created_by = u.id
       WHERE sm.product_id = $1
       ORDER BY sm.id DESC`,
      [productId]
    );

    return res.json({
      product: productResult.rows[0],
      stockMovements: movementsResult.rows
    });
  } catch (error) {
    console.error("Get product error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

export const updateProduct = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const productId = Number(req.params.id);

    if (!Number.isInteger(productId)) {
      return res.status(400).json({
        message: "Invalid product ID"
      });
    }

    const {
      name,
      sku,
      category,
      unit_price,
      current_stock,
      min_stock,
      warehouse_location
    } = req.body;

    if (!name || !sku || unit_price === undefined) {
      return res.status(400).json({
        message: "Name, SKU and unit price are required"
      });
    }

    if (Number(unit_price) < 0) {
      return res.status(400).json({
        message: "Unit price cannot be negative"
      });
    }

    if (Number(current_stock || 0) < 0 || Number(min_stock || 0) < 0) {
      return res.status(400).json({
        message: "Stock values cannot be negative"
      });
    }

    const duplicateSku = await pool.query(
      "SELECT id FROM products WHERE sku = $1 AND id <> $2",
      [sku, productId]
    );

    if (duplicateSku.rows.length > 0) {
      return res.status(409).json({
        message: "SKU already exists"
      });
    }

    const result = await pool.query(
      `UPDATE products
       SET
         name = $1,
         sku = $2,
         category = $3,
         unit_price = $4,
         current_stock = $5,
         min_stock = $6,
         warehouse_location = $7,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [
        name,
        sku,
        category || null,
        Number(unit_price),
        Number(current_stock || 0),
        Number(min_stock || 0),
        warehouse_location || null,
        productId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Product not found"
      });
    }

    return res.json({
      message: "Product updated successfully",
      product: result.rows[0]
    });
  } catch (error) {
    console.error("Update product error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

export const addStockMovement = async (
  req: AuthRequest,
  res: Response
) => {
  const client = await pool.connect();

  try {
    const productId = Number(req.params.id);
    const { movement_type, quantity, reason } = req.body;

    if (!Number.isInteger(productId)) {
      return res.status(400).json({
        message: "Invalid product ID"
      });
    }

    if (!["IN", "OUT"].includes(movement_type)) {
      return res.status(400).json({
        message: "Movement type must be IN or OUT"
      });
    }

    if (!Number.isInteger(Number(quantity)) || Number(quantity) <= 0) {
      return res.status(400).json({
        message: "Quantity must be greater than zero"
      });
    }

    if (!reason) {
      return res.status(400).json({
        message: "Reason is required"
      });
    }

    await client.query("BEGIN");

    const productResult = await client.query(
      `SELECT id, current_stock
       FROM products
       WHERE id = $1
       FOR UPDATE`,
      [productId]
    );

    if (productResult.rows.length === 0) {
      await client.query("ROLLBACK");

      return res.status(404).json({
        message: "Product not found"
      });
    }

    const currentStock = Number(productResult.rows[0].current_stock);
    const movementQuantity = Number(quantity);

    if (
      movement_type === "OUT" &&
      currentStock < movementQuantity
    ) {
      await client.query("ROLLBACK");

      return res.status(400).json({
        message: "Insufficient stock"
      });
    }

    const newStock =
      movement_type === "IN"
        ? currentStock + movementQuantity
        : currentStock - movementQuantity;

    await client.query(
      `UPDATE products
       SET current_stock = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [newStock, productId]
    );

    const movementResult = await client.query(
      `INSERT INTO stock_movements
       (product_id, movement_type, quantity, reason, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        productId,
        movement_type,
        movementQuantity,
        reason,
        req.user?.id || null
      ]
    );

    await client.query("COMMIT");

    return res.status(201).json({
      message: "Stock movement added successfully",
      movement: movementResult.rows[0],
      currentStock: newStock
    });
  } catch (error) {
    await client.query("ROLLBACK");

    console.error("Stock movement error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  } finally {
    client.release();
  }
};