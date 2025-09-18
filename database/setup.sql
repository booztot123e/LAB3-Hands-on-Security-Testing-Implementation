-- database/setup.sql
CREATE DATABASE SecurityLab;
GO

USE SecurityLab;
GO

-- ตาราง Users
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(50) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    email NVARCHAR(100) NOT NULL,
    role NVARCHAR(20) DEFAULT 'user',
    created_at DATETIME DEFAULT GETDATE()
);

-- ตาราง Comments
CREATE TABLE Comments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT FOREIGN KEY REFERENCES Users(id),
    content NVARCHAR(MAX) NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
);

-- ตาราง Products
CREATE TABLE Products (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    description NVARCHAR(MAX)
);

-- ข้อมูลทดสอบ
INSERT INTO Users (username, password, email, role) VALUES 
('admin', 'admin123', 'admin@example.com', 'admin'),
('john', 'password', 'john@example.com', 'user'),
('jane', 'qwerty', 'jane@example.com', 'user');

INSERT INTO Products (name, price, description) VALUES 
('Laptop', 25000.00, 'Gaming Laptop'),
('Mouse', 500.00, 'Wireless Mouse'),
('Keyboard', 1200.00, 'Mechanical Keyboard');

INSERT INTO Comments (user_id, content) VALUES 
(2, 'สินค้าดีมาก ใช้งานได้ดี'),
(3, 'ราคาสมเหตุสมผล แนะนำเลยครับ');