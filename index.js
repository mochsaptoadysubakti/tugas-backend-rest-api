const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

pool.connect((err) => {
    if (err) {
        console.error('Database connection error', err.stack);
    } else {
        console.log('Connected to PostgreSQL Database');
    }
});

app.post('/api/menus', async (req, res) => {
    try {
        const { name, description, price, is_available, image_path, image_url } = req.body;
        
        const newMenu = await pool.query(
            `INSERT INTO menus (name, description, price, is_available, image_path, image_url) 
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, description, price, is_available !== undefined ? is_available : true, image_path, image_url]
        );
        
        res.status(201).json(newMenu.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error" });
    }
});

app.get('/api/menus', async (req, res) => {
    try {
        const allMenus = await pool.query('SELECT * FROM menus WHERE is_deleted = false ORDER BY created_at DESC');
        
        res.status(200).json({
            page: 1,
            limit: allMenus.rows.length,
            total_pages: 1,
            data: allMenus.rows
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error" });
    }
});

app.get('/api/menus/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const menu = await pool.query('SELECT * FROM menus WHERE id = $1 AND is_deleted = false', [id]);

        if (menu.rows.length === 0) {
            return res.status(404).json({ message: "Menu tidak ditemukan" });
        }

        res.status(200).json(menu.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error" });
    }
});

app.put('/api/menus/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, is_available, image_path, image_url } = req.body;

        const checkMenu = await pool.query('SELECT * FROM menus WHERE id = $1 AND is_deleted = false', [id]);
        if (checkMenu.rows.length === 0) {
            return res.status(404).json({ message: "Menu tidak ditemukan" });
        }

        const updateMenu = await pool.query(
            `UPDATE menus SET 
                name = $1, 
                description = $2, 
                price = $3, 
                is_available = $4, 
                image_path = $5, 
                image_url = $6 
             WHERE id = $7 RETURNING *`,
            [name, description, price, is_available, image_path, image_url, id]
        );

        res.status(200).json(updateMenu.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error" });
    }
});

app.delete('/api/menus/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const checkMenu = await pool.query('SELECT * FROM menus WHERE id = $1 AND is_deleted = false', [id]);
        if (checkMenu.rows.length === 0) {
            return res.status(404).json({ message: "Menu tidak ditemukan" });
        }

        await pool.query('UPDATE menus SET is_deleted = true WHERE id = $1', [id]);

        res.status(200).json({ message: "Item deleted successfully" });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: "Server Error" });
    }
});

app.listen(port, () => {
    console.log(`Server berjalan di http://localhost:${port}`);
});