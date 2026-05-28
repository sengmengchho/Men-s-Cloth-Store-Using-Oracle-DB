import oracledb
from django.conf import settings
from django.contrib.auth.hashers import make_password, check_password


def get_connection():
    cfg = settings.ORACLE_CONFIG
    return oracledb.connect(
        user=cfg['user'], password=cfg['password'], dsn=cfg['dsn']
    )


def fetchall_as_dict(cursor):
    cols = [col[0] for col in cursor.description]
    return [dict(zip(cols, row)) for row in cursor.fetchall()]


def fetchone_as_dict(cursor):
    cols = [col[0] for col in cursor.description]
    row  = cursor.fetchone()
    return dict(zip(cols, row)) if row else None


# ── Auth ──────────────────────────────────────────────────────

def get_user_by_credentials(username, password):
    conn   = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT user_id, username, role FROM users "
        "WHERE UPPER(username)=UPPER(:1) AND password=:2",
        [username, password]
    )
    row = fetchone_as_dict(cursor)
    cursor.close(); conn.close()
    return row


def get_user_by_id(user_id):
    conn   = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT user_id, username, role FROM users WHERE user_id=:1",
        [int(user_id)]
    )
    row = fetchone_as_dict(cursor)
    cursor.close(); conn.close()
    return row


# ── Registration ──────────────────────────────────────────────

def register_customer(username, password, full_name, email, phone, address):
    conn   = get_connection()
    cursor = conn.cursor()
    cursor.callproc('proc_register_customer',
                    [username, password, full_name, email, phone, address])
    conn.commit()
    cursor.close(); conn.close()


# ── Products ──────────────────────────────────────────────────

def get_all_products():
    conn   = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM v_product_stock")
    rows = fetchall_as_dict(cursor)
    cursor.close(); conn.close()
    return rows


def add_product(name, category, price, image_url=None):
    conn   = get_connection()
    cursor = conn.cursor()
    pid_var = cursor.var(oracledb.NUMBER)
    cursor.execute(
        "INSERT INTO products (product_name, category, price, image_url) "
        "VALUES (:1,:2,:3,:4) RETURNING product_id INTO :5",
        [name, category, price, image_url, pid_var]
    )
    conn.commit()
    pid = int(pid_var.getvalue()[0])
    cursor.close(); conn.close()
    return pid


def update_product(product_id, name, category, price, image_url=None):
    conn   = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE products SET product_name=:1, category=:2, price=:3, image_url=:4 "
        "WHERE product_id=:5",
        [name, category, price, image_url, int(product_id)]
    )
    conn.commit()
    cursor.close(); conn.close()


def delete_product(product_id):
    conn   = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM product_variants WHERE product_id=:1", [int(product_id)])
    cursor.execute("DELETE FROM products WHERE product_id=:1", [int(product_id)])
    conn.commit()
    cursor.close(); conn.close()


# ── Variants ──────────────────────────────────────────────────

def get_variants(product_id):
    conn   = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT variant_id, product_id, size_, color, stock_qty "
        "FROM product_variants WHERE product_id=:1 ORDER BY variant_id",
        [int(product_id)]
    )
    rows = fetchall_as_dict(cursor)
    cursor.close(); conn.close()
    return rows


def add_variant(product_id, size_, color, stock_qty):
    conn   = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO product_variants (product_id, size_, color, stock_qty) "
        "VALUES (:1,:2,:3,:4)",
        [int(product_id), size_, color, int(stock_qty)]
    )
    conn.commit()
    cursor.close(); conn.close()


def update_variant(variant_id, size_, color, stock_qty):
    conn   = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE product_variants SET size_=:1, color=:2, stock_qty=:3 "
        "WHERE variant_id=:4",
        [size_, color, int(stock_qty), int(variant_id)]
    )
    conn.commit()
    cursor.close(); conn.close()


def delete_variant(variant_id):
    conn   = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "DELETE FROM product_variants WHERE variant_id=:1",
        [int(variant_id)]
    )
    conn.commit()
    cursor.close(); conn.close()


# ── Orders ────────────────────────────────────────────────────

def get_all_orders():
    conn   = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT order_id, customer_name, sold_by, "
        "order_date, status, total_amount "
        "FROM v_sales_report ORDER BY order_id DESC"
    )
    rows = fetchall_as_dict(cursor)
    cursor.close(); conn.close()
    return rows


def get_customer_orders(customer_id):
    conn   = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT o.order_id, "
        "NVL(c.full_name,'Unknown') AS customer_name, "
        "TO_CHAR(o.order_date,'YYYY-MM-DD') AS order_date, "
        "o.status, o.total_amount, "
        "(SELECT sub.uname FROM "
        "  (SELECT u2.username AS uname "
        "   FROM sales_log sl "
        "   JOIN users u2 ON sl.user_id = u2.user_id "
        "   WHERE sl.order_id = o.order_id "
        "   AND u2.role IN ('Admin','Sale') "
        "   ORDER BY sl.log_date DESC) sub "
        " WHERE ROWNUM = 1) AS processed_by "
        "FROM orders o "
        "LEFT JOIN customers c ON o.customer_id = c.customer_id "
        "WHERE o.customer_id = :1 "
        "ORDER BY o.order_id DESC",
        [int(customer_id)]
    )
    rows = fetchall_as_dict(cursor)
    cursor.close(); conn.close()
    return rows


def create_order(customer_id, user_id, items):
    conn   = get_connection()
    cursor = conn.cursor()

    order_id_var = cursor.var(oracledb.NUMBER)
    cursor.execute(
        "INSERT INTO orders (customer_id, user_id, status) "
        "VALUES (:1, :2, 'Pending') RETURNING order_id INTO :3",
        [int(customer_id), int(user_id), order_id_var]
    )
    order_id = int(order_id_var.getvalue()[0])

    for item in items:
        pid    = int(item['product_id'])
        qty    = int(item['quantity'])
        price  = float(item['unit_price'])
        ssize  = item.get('selected_size')  or None
        scolor = item.get('selected_color') or None

        cursor.execute(
            "INSERT INTO order_items "
            "(order_id, product_id, quantity, unit_price, selected_size, selected_color) "
            "VALUES (:1, :2, :3, :4, :5, :6)",
            [order_id, pid, qty, price, ssize, scolor]
        )

        if item.get('variant_id'):
            cursor.execute(
                "UPDATE product_variants SET stock_qty = stock_qty - :1 "
                "WHERE variant_id = :2",
                [qty, int(item['variant_id'])]
            )

    conn.commit()
    cursor.close(); conn.close()
    return order_id


def update_order_status(order_id, status):
    conn   = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE orders SET status=:1 WHERE order_id=:2",
        [status, int(order_id)]
    )
    conn.commit()
    cursor.close(); conn.close()


# ── Order Items ───────────────────────────────────────────────

def get_order_items(order_id):
    conn   = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT oi.item_id, oi.product_id, p.product_name, p.image_url, "
        "oi.quantity, oi.unit_price, "
        "NVL(oi.selected_size,'—')  AS selected_size, "
        "NVL(oi.selected_color,'—') AS selected_color, "
        "(oi.quantity * oi.unit_price) AS subtotal "
        "FROM order_items oi "
        "JOIN products p ON oi.product_id = p.product_id "
        "WHERE oi.order_id = :1 ORDER BY oi.item_id",
        [int(order_id)]
    )
    rows = fetchall_as_dict(cursor)
    cursor.close(); conn.close()
    return rows


# ── Users ─────────────────────────────────────────────────────

def get_all_users():
    conn   = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT user_id, username, role, "
        "TO_CHAR(created_date,'YYYY-MM-DD') AS created_date "
        "FROM users ORDER BY user_id ASC"
    )
    rows = fetchall_as_dict(cursor)
    cursor.close(); conn.close()
    return rows


def update_user_role(user_id, new_role):
    conn   = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "UPDATE users SET role=:1 WHERE user_id=:2",
        [new_role, int(user_id)]
    )
    conn.commit()
    cursor.close(); conn.close()


def delete_user(user_id):
    conn   = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM customers WHERE user_id=:1", [int(user_id)])
    cursor.execute("DELETE FROM users    WHERE user_id=:1", [int(user_id)])
    conn.commit()
    cursor.close(); conn.close()


# ── Customers ─────────────────────────────────────────────────

def search_customers(query):
    conn   = get_connection()
    cursor = conn.cursor()
    q = f'%{query}%'
    cursor.execute(
        "SELECT customer_id, full_name, email, phone, address "
        "FROM customers "
        "WHERE UPPER(full_name) LIKE UPPER(:1) "
        "OR phone LIKE :2 "
        "OR UPPER(email) LIKE UPPER(:3) "
        "ORDER BY full_name",
        [q, q, q]
    )
    rows = fetchall_as_dict(cursor)
    cursor.close(); conn.close()
    return rows


# ── Sales Log ─────────────────────────────────────────────────

def get_sales_log():
    conn   = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "SELECT sl.log_id, sl.order_id, u.username, sl.action, "
        "TO_CHAR(sl.log_date,'YYYY-MM-DD HH24:MI') AS log_date "
        "FROM sales_log sl LEFT JOIN users u ON sl.user_id = u.user_id "
        "ORDER BY sl.log_date DESC"
    )
    rows = fetchall_as_dict(cursor)
    cursor.close(); conn.close()
    return rows


# ── Audit ─────────────────────────────────────────────────────────────────────

def get_audit_report():
    """Full audit: every order with staff, customer, and items detail."""
    conn   = get_connection()
    cursor = conn.cursor()

    # Orders with staff and customer info
    # staff_name = last Admin/Sale who processed status (from sales_log)
    cursor.execute("""
        SELECT
            o.order_id,
            (SELECT uname FROM (
                SELECT u2.username AS uname
                FROM sales_log sl
                JOIN users u2 ON sl.user_id = u2.user_id
                WHERE sl.order_id = o.order_id
                AND u2.role IN ('Admin','Sale')
                ORDER BY sl.log_id DESC
            ) WHERE ROWNUM = 1)   AS staff_name,
            'Staff'               AS staff_role,
            c.full_name           AS customer_name,
            c.phone               AS customer_phone,
            TO_CHAR(o.order_date,'YYYY-MM-DD HH24:MI') AS order_date,
            o.status,
            NVL(o.total_amount,0) AS total_amount
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.customer_id
        ORDER BY o.order_id DESC
    """)
    orders = fetchall_as_dict(cursor)

    # Order items for each order
    cursor.execute("""
        SELECT
            oi.order_id,
            p.product_name,
            p.category,
            NVL(oi.selected_size,  '—') AS selected_size,
            NVL(oi.selected_color, '—') AS selected_color,
            oi.quantity,
            oi.unit_price,
            (oi.quantity * oi.unit_price) AS subtotal
        FROM order_items oi
        JOIN products p ON oi.product_id = p.product_id
        ORDER BY oi.order_id DESC, oi.item_id
    """)
    items = fetchall_as_dict(cursor)

    # Status change log
    cursor.execute("""
        SELECT
            sl.order_id,
            u.username  AS changed_by,
            sl.action,
            TO_CHAR(sl.log_date,'YYYY-MM-DD HH24:MI') AS log_date
        FROM sales_log sl
        LEFT JOIN users u ON sl.user_id = u.user_id
        ORDER BY sl.log_date DESC
    """)
    logs = fetchall_as_dict(cursor)

    cursor.close(); conn.close()

    # Group items and logs by order_id
    items_map = {}
    for item in items:
        oid = item['ORDER_ID']
        if oid not in items_map:
            items_map[oid] = []
        items_map[oid].append(item)

    logs_map = {}
    for log in logs:
        oid = log['ORDER_ID']
        if oid not in logs_map:
            logs_map[oid] = []
        logs_map[oid].append(log)

    for order in orders:
        oid = order['ORDER_ID']
        order['items'] = items_map.get(oid, [])
        order['logs']  = logs_map.get(oid, [])

    return orders


def get_staff_performance():
    """Summary: orders and revenue per staff member."""
    conn   = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT
            u.username,
            u.role,
            COUNT(o.order_id)                           AS total_orders,
            SUM(CASE WHEN o.status != 'Cancelled'
                     THEN NVL(o.total_amount,0) ELSE 0 END) AS total_revenue,
            SUM(CASE WHEN o.status = 'Completed'
                     THEN 1 ELSE 0 END)                 AS completed_orders,
            SUM(CASE WHEN o.status = 'Cancelled'
                     THEN 1 ELSE 0 END)                 AS cancelled_orders,
            TO_CHAR(MAX(o.order_date),'YYYY-MM-DD')     AS last_order_date
        FROM orders o
        JOIN users u ON o.user_id = u.user_id
        GROUP BY u.username, u.role
        ORDER BY total_revenue DESC
    """)
    rows = fetchall_as_dict(cursor)
    cursor.close(); conn.close()
    return rows


def create_user(username, password, full_name, email, phone, address, role):
    conn   = get_connection()
    cursor = conn.cursor()
    user_id_var = cursor.var(oracledb.NUMBER)
    cursor.execute(
        "INSERT INTO users (username, password, role) "
        "VALUES (:1, :2, :3) RETURNING user_id INTO :4",
        [username, password, role, user_id_var]
    )
    user_id = int(user_id_var.getvalue()[0])
    cursor.execute(
        "INSERT INTO customers (user_id, full_name, email, phone, address) "
        "VALUES (:1, :2, :3, :4, :5)",
        [user_id, full_name, email or '', phone or '', address or '']
    )
    conn.commit()
    cursor.close(); conn.close()
    return user_id


def log_status_change(order_id, user_id, status):
    conn   = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "INSERT INTO sales_log (order_id, user_id, action, log_date) "
            "VALUES (:1, :2, :3, SYSDATE)",
            [int(order_id), int(user_id), f'STATUS_{status.upper()}']
        )
        conn.commit()
    except Exception as e:
        print("log error:", str(e))
    cursor.close(); conn.close()

def hash_password(raw_password: str) -> str:
    """Hash a plain password using Django's PBKDF2 hasher."""
    return make_password(raw_password)


def verify_password(raw_password: str, hashed_password: str) -> bool:
    """Check a plain password against a stored hash."""
    return check_password(raw_password, hashed_password)


def format_currency(amount, currency='USD'):
    """Format a number as currency (basic version)."""
    if amount is None:
        return ''
    try:
        return f"{currency} {float(amount):,.2f}"
    except (TypeError, ValueError):
        return str(amount)
