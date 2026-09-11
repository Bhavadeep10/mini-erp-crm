import { Response } from "express";
import { pool } from "../config/database";
import { AuthRequest } from "../middleware/authMiddleware";

export const addCustomer = async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      mobile,
      email,
      business,
      gst_number,
      type,
      address,
      status,
      follow_up_date,
      notes
    } = req.body;

    if (!name || !mobile || !type) {
      return res.status(400).json({
        message: "Name, mobile and customer type are required"
      });
    }

    const validTypes = ["RETAIL", "WHOLESALE", "DISTRIBUTOR"];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        message: "Invalid customer type"
      });
    }

    const result = await pool.query(
      `INSERT INTO customers
      (name, mobile, email, business, gst_number, type, address, status, follow_up_date, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        name,
        mobile,
        email || null,
        business || null,
        gst_number || null,
        type,
        address || null,
        status || "LEAD",
        follow_up_date || null,
        notes || null
      ]
    );

    return res.status(201).json({
      message: "Customer added successfully",
      customer: result.rows[0]
    });
  } catch (error) {
    console.error("Add customer error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

export const getCustomers = async (req: AuthRequest, res: Response) => {
  try {
    const search = String(req.query.search || "");
    const status = String(req.query.status || "");
    const type = String(req.query.type || "");

    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(Math.max(Number(req.query.limit) || 10, 1), 50);
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: (string | number)[] = [];

    if (search) {
      values.push(`%${search}%`);

      conditions.push(
        `(name ILIKE $${values.length}
        OR mobile ILIKE $${values.length}
        OR email ILIKE $${values.length}
        OR business ILIKE $${values.length})`
      );
    }

    if (status) {
      values.push(status);
      conditions.push(`status = $${values.length}`);
    }

    if (type) {
      values.push(type);
      conditions.push(`type = $${values.length}`);
    }

    const whereClause =
      conditions.length > 0
        ? `WHERE ${conditions.join(" AND ")}`
        : "";

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM customers ${whereClause}`,
      values
    );

    values.push(limit);
    values.push(offset);

    const result = await pool.query(
      `SELECT *
       FROM customers
       ${whereClause}
       ORDER BY id DESC
       LIMIT $${values.length - 1}
       OFFSET $${values.length}`,
      values
    );

    const total = Number(countResult.rows[0].count);

    return res.json({
      customers: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get customers error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

export const getCustomerById = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const customerId = Number(req.params.id);

    if (!Number.isInteger(customerId)) {
      return res.status(400).json({
        message: "Invalid customer ID"
      });
    }

    const customerResult = await pool.query(
      "SELECT * FROM customers WHERE id = $1",
      [customerId]
    );

    if (customerResult.rows.length === 0) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    const followupResult = await pool.query(
      `SELECT
        cf.id,
        cf.note,
        cf.follow_up_date,
        cf.created_at,
        u.name AS created_by_name
       FROM customer_followups cf
       LEFT JOIN users u ON cf.created_by = u.id
       WHERE cf.customer_id = $1
       ORDER BY cf.id DESC`,
      [customerId]
    );

    return res.json({
      customer: customerResult.rows[0],
      followUps: followupResult.rows
    });
  } catch (error) {
    console.error("Get customer error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

export const updateCustomer = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const customerId = Number(req.params.id);

    if (!Number.isInteger(customerId)) {
      return res.status(400).json({
        message: "Invalid customer ID"
      });
    }

    const {
      name,
      mobile,
      email,
      business,
      gst_number,
      type,
      address,
      status,
      follow_up_date,
      notes
    } = req.body;

    if (!name || !mobile || !type) {
      return res.status(400).json({
        message: "Name, mobile and customer type are required"
      });
    }

    const validTypes = ["RETAIL", "WHOLESALE", "DISTRIBUTOR"];
    const validStatuses = ["LEAD", "ACTIVE", "INACTIVE"];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        message: "Invalid customer type"
      });
    }

    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        message: "Invalid customer status"
      });
    }

    const result = await pool.query(
      `UPDATE customers
       SET
         name = $1,
         mobile = $2,
         email = $3,
         business = $4,
         gst_number = $5,
         type = $6,
         address = $7,
         status = $8,
         follow_up_date = $9,
         notes = $10,
         updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [
        name,
        mobile,
        email || null,
        business || null,
        gst_number || null,
        type,
        address || null,
        status || "LEAD",
        follow_up_date || null,
        notes || null,
        customerId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    return res.json({
      message: "Customer updated successfully",
      customer: result.rows[0]
    });
  } catch (error) {
    console.error("Update customer error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};

export const addFollowUp = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const customerId = Number(req.params.id);
    const { note, follow_up_date } = req.body;

    if (!Number.isInteger(customerId)) {
      return res.status(400).json({
        message: "Invalid customer ID"
      });
    }

    if (!note) {
      return res.status(400).json({
        message: "Follow-up note is required"
      });
    }

    const customerResult = await pool.query(
      "SELECT id FROM customers WHERE id = $1",
      [customerId]
    );

    if (customerResult.rows.length === 0) {
      return res.status(404).json({
        message: "Customer not found"
      });
    }

    const result = await pool.query(
      `INSERT INTO customer_followups
       (customer_id, note, follow_up_date, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        customerId,
        note,
        follow_up_date || null,
        req.user?.id || null
      ]
    );

    if (follow_up_date) {
      await pool.query(
        `UPDATE customers
         SET follow_up_date = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [follow_up_date, customerId]
      );
    }

    return res.status(201).json({
      message: "Follow-up added successfully",
      followUp: result.rows[0]
    });
  } catch (error) {
    console.error("Add follow-up error:", error);

    return res.status(500).json({
      message: "Server error"
    });
  }
};