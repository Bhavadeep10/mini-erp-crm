import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API = "https://mini-erp-crm-uuh8.onrender.com";

function App() {
  const savedUser = JSON.parse(localStorage.getItem("user") || "null");
  const savedToken = localStorage.getItem("token");

  const [user, setUser] = useState(savedUser);
  const [loggedIn, setLoggedIn] = useState(!!savedToken);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  const [activePage, setActivePage] = useState("Dashboard");

  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [challans, setChallans] = useState([]);

  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const [loading, setLoading] = useState(false);

  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [showStockForm, setShowStockForm] = useState(false);
  const [showChallanForm, setShowChallanForm] = useState(false);

  const [editingCustomer, setEditingCustomer] = useState(null);
  const [editingProduct, setEditingProduct] = useState(null);

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const [customerForm, setCustomerForm] = useState({
    name: "",
    mobile: "",
    email: "",
    business: "",
    gst_number: "",
    type: "RETAIL",
    address: "",
    status: "LEAD",
    follow_up_date: "",
    notes: ""
  });

  const [productForm, setProductForm] = useState({
    name: "",
    sku: "",
    category: "",
    unit_price: "",
    current_stock: "",
    min_stock: "",
    warehouse_location: ""
  });

  const [stockForm, setStockForm] = useState({
    movement_type: "IN",
    quantity: "",
    reason: ""
  });

  const [followUpNote, setFollowUpNote] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");

  const [challanForm, setChallanForm] = useState({
    customer_id: "",
    product_id: "",
    quantity: 1
  });

  const [challanItems, setChallanItems] = useState([]);

  const token = localStorage.getItem("token");

  const authHeaders = {
    Authorization: `Bearer ${token}`
  };

  const jsonHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`
  };

  /* =====================================================
     LOGIN
  ===================================================== */

  const handleLogin = async (event) => {
    event.preventDefault();

    setLoginMessage("Logging in...");

    try {
      const response = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email,
          password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginMessage(data.message || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      setUser(data.user);
      setLoggedIn(true);
      setLoginMessage("");
    } catch (error) {
      console.error(error);
      setLoginMessage("Cannot connect to backend");
    }
  };

  /* =====================================================
     LOGOUT
  ===================================================== */

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setLoggedIn(false);
    setActivePage("Dashboard");
  };

  /* =====================================================
     CUSTOMERS
  ===================================================== */

  const loadCustomers = async (searchText = "") => {
    try {
      const response = await fetch(
        `${API}/api/customers?search=${encodeURIComponent(searchText)}`,
        {
          headers: authHeaders
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to load customers");
        return;
      }

      setCustomers(data.customers || []);
    } catch (error) {
      console.error(error);
      alert("Cannot connect to backend");
    }
  };

  const openCustomers = () => {
    setActivePage("Customers");
    loadCustomers(customerSearch);
  };

  const handleCustomerSearch = (event) => {
    const value = event.target.value;
    setCustomerSearch(value);
    loadCustomers(value);
  };

  const handleCustomerChange = (event) => {
    const { name, value } = event.target;

    setCustomerForm({
      ...customerForm,
      [name]: value
    });
  };

  const resetCustomerForm = () => {
    setCustomerForm({
      name: "",
      mobile: "",
      email: "",
      business: "",
      gst_number: "",
      type: "RETAIL",
      address: "",
      status: "LEAD",
      follow_up_date: "",
      notes: ""
    });

    setEditingCustomer(null);
  };

  const handleAddCustomer = async (event) => {
    event.preventDefault();

    try {
      const response = await fetch(`${API}/api/customers`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(customerForm)
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to add customer");
        return;
      }

      alert("Customer added successfully!");

      resetCustomerForm();
      setShowCustomerForm(false);

      loadCustomers(customerSearch);
    } catch (error) {
      console.error(error);
      alert("Cannot connect to backend");
    }
  };

  const startEditCustomer = (customer) => {
    setEditingCustomer(customer);

    setCustomerForm({
      name: customer.name || "",
      mobile: customer.mobile || "",
      email: customer.email || "",
      business: customer.business || "",
      gst_number: customer.gst_number || "",
      type: customer.type || "RETAIL",
      address: customer.address || "",
      status: customer.status || "LEAD",
      follow_up_date: customer.follow_up_date
        ? customer.follow_up_date.substring(0, 10)
        : "",
      notes: customer.notes || ""
    });

    setSelectedCustomer(null);
    setShowCustomerForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const handleUpdateCustomer = async (event) => {
    event.preventDefault();

    if (!editingCustomer) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/customers/${editingCustomer.id}`,
        {
          method: "PUT",
          headers: jsonHeaders,
          body: JSON.stringify(customerForm)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to update customer");
        return;
      }

      alert("Customer updated successfully!");

      resetCustomerForm();
      setShowCustomerForm(false);

      loadCustomers(customerSearch);
    } catch (error) {
      console.error(error);
      alert("Cannot connect to backend");
    }
  };

  const viewCustomer = async (customerId) => {
    try {
      const response = await fetch(
        `${API}/api/customers/${customerId}`,
        {
          headers: authHeaders
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to load customer");
        return;
      }

      setSelectedCustomer(data);
      setFollowUpNote("");
      setFollowUpDate("");
    } catch (error) {
      console.error(error);
      alert("Cannot connect to backend");
    }
  };

  const handleFollowUp = async (event) => {
    event.preventDefault();

    if (!selectedCustomer) {
      return;
    }

    if (!followUpNote.trim()) {
      alert("Please enter a follow-up note");
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/customers/${selectedCustomer.customer.id}/followups`,
        {
          method: "POST",
          headers: jsonHeaders,
          body: JSON.stringify({
            note: followUpNote,
            follow_up_date: followUpDate || null
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to add follow-up");
        return;
      }

      alert("Follow-up added successfully!");

      setFollowUpNote("");
      setFollowUpDate("");

      await viewCustomer(selectedCustomer.customer.id);
      loadCustomers(customerSearch);
    } catch (error) {
      console.error(error);
      alert("Cannot connect to backend");
    }
  };

  /* =====================================================
     PRODUCTS
  ===================================================== */

  const loadProducts = async (searchText = "") => {
    try {
      const response = await fetch(
        `${API}/api/products?search=${encodeURIComponent(searchText)}`,
        {
          headers: authHeaders
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to load products");
        return;
      }

      setProducts(data.products || []);
    } catch (error) {
      console.error(error);
      alert("Cannot connect to backend");
    }
  };

  const openProducts = () => {
    setActivePage("Products");
    loadProducts(productSearch);
  };

  const handleProductSearch = (event) => {
    const value = event.target.value;

    setProductSearch(value);
    loadProducts(value);
  };

  const handleProductChange = (event) => {
    const { name, value } = event.target;

    setProductForm({
      ...productForm,
      [name]: value
    });
  };

  const resetProductForm = () => {
    setProductForm({
      name: "",
      sku: "",
      category: "",
      unit_price: "",
      current_stock: "",
      min_stock: "",
      warehouse_location: ""
    });

    setEditingProduct(null);
  };

  const handleAddProduct = async (event) => {
    event.preventDefault();

    try {
      const body = {
        ...productForm,
        unit_price: Number(productForm.unit_price),
        current_stock: Number(productForm.current_stock),
        min_stock: Number(productForm.min_stock)
      };

      const response = await fetch(`${API}/api/products`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to add product");
        return;
      }

      alert("Product added successfully!");

      resetProductForm();
      setShowProductForm(false);

      loadProducts(productSearch);
    } catch (error) {
      console.error(error);
      alert("Cannot connect to backend");
    }
  };

  const startEditProduct = (product) => {
    setEditingProduct(product);

    setProductForm({
      name: product.name || "",
      sku: product.sku || "",
      category: product.category || "",
      unit_price: product.unit_price || "",
      current_stock: product.current_stock || "",
      min_stock: product.min_stock || "",
      warehouse_location: product.warehouse_location || ""
    });

    setShowProductForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const handleUpdateProduct = async (event) => {
    event.preventDefault();

    if (!editingProduct) {
      return;
    }

    try {
      const body = {
        ...productForm,
        unit_price: Number(productForm.unit_price),
        current_stock: Number(productForm.current_stock),
        min_stock: Number(productForm.min_stock)
      };

      const response = await fetch(
        `${API}/api/products/${editingProduct.id}`,
        {
          method: "PUT",
          headers: jsonHeaders,
          body: JSON.stringify(body)
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to update product");
        return;
      }

      alert("Product updated successfully!");

      resetProductForm();
      setShowProductForm(false);

      loadProducts(productSearch);
    } catch (error) {
      console.error(error);
      alert("Cannot connect to backend");
    }
  };

  const viewProduct = async (productId) => {
    try {
      const response = await fetch(
        `${API}/api/products/${productId}`,
        {
          headers: authHeaders
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to load product");
        return;
      }

      setSelectedProduct(data);
    } catch (error) {
      console.error(error);
      alert("Cannot connect to backend");
    }
  };

  const openStockForm = (product) => {
    setSelectedProduct(null);

    setStockForm({
      movement_type: "IN",
      quantity: "",
      reason: ""
    });

    setEditingProduct(product);
    setShowStockForm(true);
  };

  const handleStockMovement = async (event) => {
    event.preventDefault();

    if (!editingProduct) {
      return;
    }

    if (Number(stockForm.quantity) <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }

    if (!stockForm.reason.trim()) {
      alert("Please enter a reason");
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/products/${editingProduct.id}/stock`,
        {
          method: "POST",
          headers: jsonHeaders,
          body: JSON.stringify({
            movement_type: stockForm.movement_type,
            quantity: Number(stockForm.quantity),
            reason: stockForm.reason
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Stock movement failed");
        return;
      }

      alert("Stock movement recorded successfully!");

      setShowStockForm(false);
      setEditingProduct(null);

      loadProducts(productSearch);
    } catch (error) {
      console.error(error);
      alert("Cannot connect to backend");
    }
  };

  /* =====================================================
     CHALLANS
  ===================================================== */

  const loadChallans = async () => {
    try {
      const response = await fetch(`${API}/api/challans`, {
        headers: authHeaders
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to load challans");
        return;
      }

      setChallans(data.challans || []);
    } catch (error) {
      console.error(error);
      alert("Cannot connect to backend");
    }
  };

  const openChallans = () => {
    setActivePage("Challans");

    loadCustomers("");
    loadProducts("");
    loadChallans();
  };

  const addChallanItem = () => {
    const product = products.find(
      (item) => String(item.id) === String(challanForm.product_id)
    );

    if (!product) {
      alert("Please select a product");
      return;
    }

    const quantity = Number(challanForm.quantity);

    if (quantity <= 0) {
      alert("Quantity must be greater than 0");
      return;
    }

    const existingItem = challanItems.find(
      (item) => item.product_id === product.id
    );

    if (existingItem) {
      setChallanItems(
        challanItems.map((item) =>
          item.product_id === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity
              }
            : item
        )
      );
    } else {
      setChallanItems([
        ...challanItems,
        {
          product_id: product.id,
          product_name: product.name,
          sku: product.sku,
          unit_price: Number(product.unit_price),
          quantity
        }
      ]);
    }

    setChallanForm({
      ...challanForm,
      product_id: "",
      quantity: 1
    });
  };

  const removeChallanItem = (productId) => {
    setChallanItems(
      challanItems.filter(
        (item) => item.product_id !== productId
      )
    );
  };

  const resetChallanForm = () => {
    setChallanForm({
      customer_id: "",
      product_id: "",
      quantity: 1
    });

    setChallanItems([]);
  };

  const createChallan = async (event) => {
    event.preventDefault();

    if (!challanForm.customer_id) {
      alert("Please select a customer");
      return;
    }

    if (challanItems.length === 0) {
      alert("Please add at least one product");
      return;
    }

    try {
      const response = await fetch(`${API}/api/challans`, {
        method: "POST",
        headers: jsonHeaders,
        body: JSON.stringify({
          customer_id: Number(challanForm.customer_id),
          items: challanItems.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity
          }))
        })
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to create challan");
        return;
      }

      alert("Sales challan created successfully!");

      resetChallanForm();
      setShowChallanForm(false);

      loadChallans();
    } catch (error) {
      console.error(error);
      alert("Cannot connect to backend");
    }
  };

  const confirmChallan = async (challanId) => {
    const confirmAction = window.confirm(
      "Are you sure you want to confirm this challan? Stock will be reduced."
    );

    if (!confirmAction) {
      return;
    }

    try {
      const response = await fetch(
        `${API}/api/challans/${challanId}/confirm`,
        {
          method: "PUT",
          headers: authHeaders
        }
      );

      const data = await response.json();

      if (!response.ok) {
        alert(data.message || "Failed to confirm challan");
        return;
      }

      alert("Challan confirmed successfully!");

      loadChallans();
      loadProducts(productSearch);
    } catch (error) {
      console.error(error);
      alert("Cannot connect to backend");
    }
  };

  /* =====================================================
     FORMATTERS
  ===================================================== */

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}-${month}-${year}`;
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleString("en-IN");
  };

  const money = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  };

  /* =====================================================
     DASHBOARD COUNTS
  ===================================================== */

  const lowStockProducts = useMemo(() => {
    return products.filter(
      (product) =>
        Number(product.current_stock) <=
        Number(product.min_stock)
    );
  }, [products]);

  useEffect(() => {
    if (loggedIn) {
      loadCustomers("");
      loadProducts("");
      loadChallans();
    }
  }, [loggedIn]);

  /* =====================================================
     LOGIN PAGE
  ===================================================== */

  if (!loggedIn || !user) {
    return (
      <div className="app">

        <div className="login-watermark">
          BHAVADEEP
        </div>

        <div className="login-box">

          <div className="login-logo">
            🏢
          </div>

          <h1>Mini ERP + CRM</h1>

          <p className="subtitle">
            Operations Management Portal
          </p>

          <form onSubmit={handleLogin}>

            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
            />

            <label>Password</label>

            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
            />

            <button
              type="submit"
              className="login-button"
            >
              🔐 Login
            </button>

          </form>

          {loginMessage && (
            <p className="message">
              {loginMessage}
            </p>
          )}

          <p className="footer-text">
            ERP & CRM Management System
          </p>

          <div className="developer-name">
            Developed by <strong>BHAVADEEP</strong>
          </div>

        </div>
      </div>
    );
  }

  /* =====================================================
     MAIN WEBSITE
  ===================================================== */

  return (
    <div className="dashboard">

      <div className="watermark">
        BHAVADEEP
      </div>

      {/* HEADER */}

      <header className="top-header">

        <div className="brand">

          <h1>
            Mini ERP + CRM
          </h1>

          <p>
            Operations Management Portal
          </p>

        </div>

        <div className="user-section">

          <div className="user-info">

            <span>
              Welcome, {user.name}
            </span>

            <small>
              {user.role}
            </small>

          </div>

          <button
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

      </header>

      {/* NAVIGATION */}

      <nav className="navigation">

        <button
          className={
            activePage === "Dashboard"
              ? "nav-active"
              : ""
          }
          onClick={() =>
            setActivePage("Dashboard")
          }
        >
          🏠 Dashboard
        </button>

        <button
          className={
            activePage === "Customers"
              ? "nav-active"
              : ""
          }
          onClick={openCustomers}
        >
          👥 Customers
        </button>

        <button
          className={
            activePage === "Products"
              ? "nav-active"
              : ""
          }
          onClick={openProducts}
        >
          📦 Products
        </button>

        <button
          className={
            activePage === "Challans"
              ? "nav-active"
              : ""
          }
          onClick={openChallans}
        >
          🚚 Sales Challans
        </button>

        <button
          className={
            activePage === "Stock"
              ? "nav-active"
              : ""
          }
          onClick={openProducts}
        >
          📊 Stock
        </button>

      </nav>

      {/* =================================================
          DASHBOARD
      ================================================= */}

      {activePage === "Dashboard" && (

        <main className="dashboard-content">

          <div className="page-title">

            <h2>
              Dashboard
            </h2>

            <p>
              Welcome back, {user.name}.
              Here's your operations overview.
            </p>

          </div>

          <div className="welcome-card">

            <div className="welcome-icon">
              👋
            </div>

            <div>

              <h3>
                Welcome, {user.name}!
              </h3>

              <p>
                You are logged in to the Mini ERP + CRM
                Operations Portal.
              </p>

              <div className="role-badge">
                Role: {user.role}
              </div>

            </div>

          </div>

          <div className="stats-grid">

            <div className="stat-card pink">

              <div className="stat-icon">
                👥
              </div>

              <div>
                <span>
                  Customers
                </span>

                <strong>
                  {customers.length}
                </strong>
              </div>

            </div>

            <div className="stat-card blue">

              <div className="stat-icon">
                📦
              </div>

              <div>
                <span>
                  Products
                </span>

                <strong>
                  {products.length}
                </strong>
              </div>

            </div>

            <div className="stat-card orange">

              <div className="stat-icon">
                🚚
              </div>

              <div>
                <span>
                  Challans
                </span>

                <strong>
                  {challans.length}
                </strong>
              </div>

            </div>

            <div className="stat-card green">

              <div className="stat-icon">
                ⚠️
              </div>

              <div>
                <span>
                  Low Stock
                </span>

                <strong>
                  {lowStockProducts.length}
                </strong>
              </div>

            </div>

          </div>

          <div className="dashboard-cards">

            <div className="dashboard-card customers-card">

              <div className="card-icon">
                👥
              </div>

              <h3>
                Customers
              </h3>

              <p>
                Manage CRM customers, business details
                and follow-ups.
              </p>

              <button onClick={openCustomers}>
                View Customers →
              </button>

            </div>

            <div className="dashboard-card products-card">

              <div className="card-icon">
                📦
              </div>

              <h3>
                Products
              </h3>

              <p>
                Manage products, prices, SKU and
                inventory stock.
              </p>

              <button onClick={openProducts}>
                View Products →
              </button>

            </div>

            <div className="dashboard-card challan-card">

              <div className="card-icon">
                🚚
              </div>

              <h3>
                Sales Challans
              </h3>

              <p>
                Create, manage and confirm sales
                challans.
              </p>

              <button onClick={openChallans}>
                View Challans →
              </button>

            </div>

            <div className="dashboard-card stock-card">

              <div className="card-icon">
                📊
              </div>

              <h3>
                Stock
              </h3>

              <p>
                Track stock IN, stock OUT and
                inventory movements.
              </p>

              <button onClick={openProducts}>
                View Stock →
              </button>

            </div>

          </div>

          <div className="quick-section">

            <h2>
              System Overview
            </h2>

            <div className="quick-cards">

              <div className="quick-card">
                <span className="quick-number">
                  CRM
                </span>
                <span>
                  Customer Management
                </span>
              </div>

              <div className="quick-card">
                <span className="quick-number">
                  ERP
                </span>
                <span>
                  Inventory Operations
                </span>
              </div>

              <div className="quick-card">
                <span className="quick-number">
                  API
                </span>
                <span>
                  REST API Connected
                </span>
              </div>

            </div>

          </div>

        </main>

      )}

      {/* =================================================
          CUSTOMERS
      ================================================= */}

      {activePage === "Customers" && (

        <main className="dashboard-content">

          <div className="page-title">

            <h2>
              👥 Customer Management
            </h2>

            <p>
              Manage CRM customers, business information
              and follow-ups.
            </p>

          </div>

          <div className="customer-action-bar">

            <button
              className="add-customer-button"
              onClick={() => {
                resetCustomerForm();
                setShowCustomerForm(
                  !showCustomerForm
                );
              }}
            >
              ➕ Add Customer
            </button>

            <span>
              Total Customers:
              <strong>
                {" "}{customers.length}
              </strong>
            </span>

          </div>

          {showCustomerForm && (

            <div className="form-card">

              <div className="form-heading">

                <div>
                  <span className="form-label-top">
                    CUSTOMER
                  </span>

                  <h3>
                    {editingCustomer
                      ? "✏️ Edit Customer"
                      : "➕ Add New Customer"}
                  </h3>
                </div>

                <button
                  className="close-button"
                  onClick={() => {
                    resetCustomerForm();
                    setShowCustomerForm(false);
                  }}
                >
                  ✕
                </button>

              </div>

              <form
                className="customer-form"
                onSubmit={
                  editingCustomer
                    ? handleUpdateCustomer
                    : handleAddCustomer
                }
              >

                <div className="form-group">
                  <label>Customer Name *</label>

                  <input
                    name="name"
                    value={customerForm.name}
                    onChange={handleCustomerChange}
                    placeholder="Enter customer name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Mobile *</label>

                  <input
                    name="mobile"
                    value={customerForm.mobile}
                    onChange={handleCustomerChange}
                    placeholder="Enter mobile number"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Email</label>

                  <input
                    type="email"
                    name="email"
                    value={customerForm.email}
                    onChange={handleCustomerChange}
                    placeholder="Enter email"
                  />
                </div>

                <div className="form-group">
                  <label>Business</label>

                  <input
                    name="business"
                    value={customerForm.business}
                    onChange={handleCustomerChange}
                    placeholder="Business name"
                  />
                </div>

                <div className="form-group">
                  <label>GST Number</label>

                  <input
                    name="gst_number"
                    value={customerForm.gst_number}
                    onChange={handleCustomerChange}
                    placeholder="GST number"
                  />
                </div>

                <div className="form-group">
                  <label>Customer Type *</label>

                  <select
                    name="type"
                    value={customerForm.type}
                    onChange={handleCustomerChange}
                  >
                    <option value="RETAIL">
                      Retail
                    </option>

                    <option value="WHOLESALE">
                      Wholesale
                    </option>

                    <option value="DISTRIBUTOR">
                      Distributor
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Status</label>

                  <select
                    name="status"
                    value={customerForm.status}
                    onChange={handleCustomerChange}
                  >
                    <option value="LEAD">
                      Lead
                    </option>

                    <option value="ACTIVE">
                      Active
                    </option>

                    <option value="INACTIVE">
                      Inactive
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Follow-up Date</label>

                  <input
                    type="date"
                    name="follow_up_date"
                    value={
                      customerForm.follow_up_date
                    }
                    onChange={handleCustomerChange}
                  />
                </div>

                <div className="form-group full-width">
                  <label>Address</label>

                  <textarea
                    name="address"
                    value={customerForm.address}
                    onChange={handleCustomerChange}
                    placeholder="Customer address"
                    rows="3"
                  />
                </div>

                <div className="form-group full-width">
                  <label>Notes</label>

                  <textarea
                    name="notes"
                    value={customerForm.notes}
                    onChange={handleCustomerChange}
                    placeholder="Customer notes"
                    rows="3"
                  />
                </div>

                <div className="form-buttons">

                  <button
                    type="submit"
                    className="save-button"
                  >
                    {editingCustomer
                      ? "💾 Update Customer"
                      : "💾 Save Customer"}
                  </button>

                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => {
                      resetCustomerForm();
                      setShowCustomerForm(false);
                    }}
                  >
                    Cancel
                  </button>

                </div>

              </form>

            </div>

          )}

          <div className="search-card">

            <input
              type="text"
              placeholder="🔍 Search by name, mobile, email or business..."
              value={customerSearch}
              onChange={handleCustomerSearch}
            />

            <button
              onClick={() =>
                loadCustomers(customerSearch)
              }
            >
              Search
            </button>

          </div>

          <div className="table-card">

            <table>

              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Business</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Follow-up</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>

                {customers.length === 0 ? (

                  <tr>
                    <td
                      colSpan="8"
                      className="no-data"
                    >
                      No customers found
                    </td>
                  </tr>

                ) : (

                  customers.map((customer) => (

                    <tr key={customer.id}>

                      <td>
                        {customer.id}
                      </td>

                      <td>
                        <strong>
                          {customer.name}
                        </strong>
                      </td>

                      <td>
                        {customer.mobile}
                      </td>

                      <td>
                        {customer.business || "-"}
                      </td>

                      <td>
                        <span className="type-badge">
                          {customer.type}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            "status-badge " +
                            customer.status.toLowerCase()
                          }
                        >
                          {customer.status}
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          customer.follow_up_date
                        )}
                      </td>

                      <td>

                        <div className="action-buttons">

                          <button
                            className="view-button"
                            onClick={() =>
                              viewCustomer(
                                customer.id
                              )
                            }
                          >
                            👁️ View
                          </button>

                          <button
                            className="edit-button"
                            onClick={() =>
                              startEditCustomer(
                                customer
                              )
                            }
                          >
                            ✏️ Edit
                          </button>

                        </div>

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </main>

      )}

      {/* =================================================
          CUSTOMER MODAL
      ================================================= */}

      {selectedCustomer && (

        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header">

              <div>
                <span>
                  CRM CUSTOMER
                </span>

                <h2>
                  {selectedCustomer.customer.name}
                </h2>
              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setSelectedCustomer(null)
                }
              >
                ✕
              </button>

            </div>

            <div className="detail-grid">

              <div className="detail-box">
                <span>Customer ID</span>
                <strong>
                  #{selectedCustomer.customer.id}
                </strong>
              </div>

              <div className="detail-box">
                <span>Mobile</span>
                <strong>
                  {selectedCustomer.customer.mobile}
                </strong>
              </div>

              <div className="detail-box">
                <span>Email</span>
                <strong>
                  {selectedCustomer.customer.email || "-"}
                </strong>
              </div>

              <div className="detail-box">
                <span>Business</span>
                <strong>
                  {selectedCustomer.customer.business || "-"}
                </strong>
              </div>

              <div className="detail-box">
                <span>GST Number</span>
                <strong>
                  {selectedCustomer.customer.gst_number || "-"}
                </strong>
              </div>

              <div className="detail-box">
                <span>Customer Type</span>
                <strong>
                  {selectedCustomer.customer.type}
                </strong>
              </div>

              <div className="detail-box">
                <span>Status</span>
                <strong>
                  {selectedCustomer.customer.status}
                </strong>
              </div>

              <div className="detail-box">
                <span>Follow-up Date</span>
                <strong>
                  {formatDate(
                    selectedCustomer.customer.follow_up_date
                  )}
                </strong>
              </div>

              <div className="detail-box full-detail">
                <span>Address</span>
                <strong>
                  {selectedCustomer.customer.address || "-"}
                </strong>
              </div>

              <div className="detail-box full-detail">
                <span>Notes</span>
                <strong>
                  {selectedCustomer.customer.notes || "-"}
                </strong>
              </div>

            </div>

            <div className="followup-box">

              <h3>
                📝 Add Follow-up
              </h3>

              <form onSubmit={handleFollowUp}>

                <textarea
                  value={followUpNote}
                  onChange={(event) =>
                    setFollowUpNote(
                      event.target.value
                    )
                  }
                  placeholder="Enter follow-up note..."
                  rows="3"
                  required
                />

                <div className="followup-row">

                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(event) =>
                      setFollowUpDate(
                        event.target.value
                      )
                    }
                  />

                  <button
                    type="submit"
                    className="followup-button"
                  >
                    ➕ Add Follow-up
                  </button>

                </div>

              </form>

            </div>

            <div className="history-box">

              <h3>
                📋 Follow-up History
              </h3>

              {selectedCustomer.followUps &&
              selectedCustomer.followUps.length > 0 ? (

                selectedCustomer.followUps.map(
                  (followup) => (

                    <div
                      className="history-item"
                      key={followup.id}
                    >

                      <div>
                        <strong>
                          {formatDate(
                            followup.follow_up_date
                          )}
                        </strong>

                        <span>
                          {followup.created_by_name ||
                            "User"}
                        </span>
                      </div>

                      <p>
                        {followup.note}
                      </p>

                    </div>

                  )
                )

              ) : (

                <p className="muted">
                  No follow-ups yet.
                </p>

              )}

            </div>

            <div className="modal-footer">

              <button
                className="edit-from-modal"
                onClick={() =>
                  startEditCustomer(
                    selectedCustomer.customer
                  )
                }
              >
                ✏️ Edit Customer
              </button>

              <button
                className="cancel-button"
                onClick={() =>
                  setSelectedCustomer(null)
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

      {/* =================================================
          PRODUCTS
      ================================================= */}

      {activePage === "Products" && (

        <main className="dashboard-content">

          <div className="page-title">

            <h2>
              📦 Products & Inventory
            </h2>

            <p>
              Manage products, prices, stock and
              warehouse information.
            </p>

          </div>

          <div className="customer-action-bar">

            <button
              className="add-customer-button blue-button"
              onClick={() => {
                resetProductForm();
                setShowProductForm(
                  !showProductForm
                );
              }}
            >
              ➕ Add Product
            </button>

            <div className="inventory-summary">

              <span>
                Products:
                <strong>
                  {" "}{products.length}
                </strong>
              </span>

              <span className="low-stock-text">
                Low Stock:
                <strong>
                  {" "}{lowStockProducts.length}
                </strong>
              </span>

            </div>

          </div>

          {showProductForm && (

            <div className="form-card">

              <div className="form-heading">

                <div>
                  <span className="form-label-top">
                    INVENTORY
                  </span>

                  <h3>
                    {editingProduct
                      ? "✏️ Edit Product"
                      : "➕ Add New Product"}
                  </h3>
                </div>

                <button
                  className="close-button"
                  onClick={() => {
                    resetProductForm();
                    setShowProductForm(false);
                  }}
                >
                  ✕
                </button>

              </div>

              <form
                className="customer-form"
                onSubmit={
                  editingProduct
                    ? handleUpdateProduct
                    : handleAddProduct
                }
              >

                <div className="form-group">
                  <label>Product Name *</label>

                  <input
                    name="name"
                    value={productForm.name}
                    onChange={handleProductChange}
                    placeholder="Product name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>SKU *</label>

                  <input
                    name="sku"
                    value={productForm.sku}
                    onChange={handleProductChange}
                    placeholder="Example: TP-1001"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>

                  <input
                    name="category"
                    value={productForm.category}
                    onChange={handleProductChange}
                    placeholder="Product category"
                  />
                </div>

                <div className="form-group">
                  <label>Unit Price *</label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="unit_price"
                    value={productForm.unit_price}
                    onChange={handleProductChange}
                    placeholder="2499"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Current Stock *</label>

                  <input
                    type="number"
                    min="0"
                    name="current_stock"
                    value={productForm.current_stock}
                    onChange={handleProductChange}
                    placeholder="20"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Minimum Stock Alert *</label>

                  <input
                    type="number"
                    min="0"
                    name="min_stock"
                    value={productForm.min_stock}
                    onChange={handleProductChange}
                    placeholder="5"
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label>Warehouse Location</label>

                  <input
                    name="warehouse_location"
                    value={
                      productForm.warehouse_location
                    }
                    onChange={handleProductChange}
                    placeholder="Bengaluru Warehouse"
                  />
                </div>

                <div className="form-buttons">

                  <button
                    type="submit"
                    className="save-button"
                  >
                    {editingProduct
                      ? "💾 Update Product"
                      : "💾 Save Product"}
                  </button>

                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => {
                      resetProductForm();
                      setShowProductForm(false);
                    }}
                  >
                    Cancel
                  </button>

                </div>

              </form>

            </div>

          )}

          {showStockForm && (

            <div className="form-card stock-form-card">

              <div className="form-heading">

                <div>
                  <span className="form-label-top">
                    STOCK MOVEMENT
                  </span>

                  <h3>
                    📊 {editingProduct?.name}
                  </h3>

                  <p>
                    Current stock:
                    <strong>
                      {" "}{editingProduct?.current_stock}
                    </strong>
                  </p>
                </div>

                <button
                  className="close-button"
                  onClick={() =>
                    setShowStockForm(false)
                  }
                >
                  ✕
                </button>

              </div>

              <form
                className="customer-form"
                onSubmit={handleStockMovement}
              >

                <div className="form-group">
                  <label>Movement Type</label>

                  <select
                    value={stockForm.movement_type}
                    onChange={(event) =>
                      setStockForm({
                        ...stockForm,
                        movement_type:
                          event.target.value
                      })
                    }
                  >
                    <option value="IN">
                      📥 Stock IN
                    </option>

                    <option value="OUT">
                      📤 Stock OUT
                    </option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Quantity *</label>

                  <input
                    type="number"
                    min="1"
                    value={stockForm.quantity}
                    onChange={(event) =>
                      setStockForm({
                        ...stockForm,
                        quantity:
                          event.target.value
                      })
                    }
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label>Reason *</label>

                  <input
                    value={stockForm.reason}
                    onChange={(event) =>
                      setStockForm({
                        ...stockForm,
                        reason: event.target.value
                      })
                    }
                    placeholder="Purchase / Sale / Damage / Return"
                    required
                  />
                </div>

                <div className="form-buttons">

                  <button
                    type="submit"
                    className="save-button"
                  >
                    📊 Record Movement
                  </button>

                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() =>
                      setShowStockForm(false)
                    }
                  >
                    Cancel
                  </button>

                </div>

              </form>

            </div>

          )}

          <div className="search-card">

            <input
              type="text"
              placeholder="🔍 Search by product name, SKU or category..."
              value={productSearch}
              onChange={handleProductSearch}
            />

            <button
              onClick={() =>
                loadProducts(productSearch)
              }
            >
              Search
            </button>

          </div>

          <div className="table-card">

            <table>

              <thead>

                <tr>
                  <th>ID</th>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Unit Price</th>
                  <th>Stock</th>
                  <th>Min Stock</th>
                  <th>Warehouse</th>
                  <th>Actions</th>
                </tr>

              </thead>

              <tbody>

                {products.length === 0 ? (

                  <tr>
                    <td
                      colSpan="9"
                      className="no-data"
                    >
                      No products found
                    </td>
                  </tr>

                ) : (

                  products.map((product) => {

                    const lowStock =
                      Number(product.current_stock) <=
                      Number(product.min_stock);

                    return (
                      <tr key={product.id}>

                        <td>
                          {product.id}
                        </td>

                        <td>
                          <strong>
                            {product.name}
                          </strong>
                        </td>

                        <td>
                          <span className="sku-badge">
                            {product.sku}
                          </span>
                        </td>

                        <td>
                          {product.category || "-"}
                        </td>

                        <td>
                          {money(product.unit_price)}
                        </td>

                        <td>

                          <span
                            className={
                              lowStock
                                ? "stock-badge low"
                                : "stock-badge good"
                            }
                          >
                            {product.current_stock}
                          </span>

                        </td>

                        <td>
                          {product.min_stock}
                        </td>

                        <td>
                          {product.warehouse_location ||
                            "-"}
                        </td>

                        <td>

                          <div className="action-buttons">

                            <button
                              className="view-button"
                              onClick={() =>
                                viewProduct(
                                  product.id
                                )
                              }
                            >
                              👁️
                            </button>

                            <button
                              className="edit-button"
                              onClick={() =>
                                startEditProduct(
                                  product
                                )
                              }
                            >
                              ✏️
                            </button>

                            <button
                              className="stock-button"
                              onClick={() =>
                                openStockForm(
                                  product
                                )
                              }
                            >
                              📊
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  })

                )}

              </tbody>

            </table>

          </div>

        </main>

      )}

      {/* =================================================
          PRODUCT MODAL
      ================================================= */}

      {selectedProduct && (

        <div className="modal-overlay">

          <div className="modal">

            <div className="modal-header product-header">

              <div>

                <span>
                  INVENTORY PRODUCT
                </span>

                <h2>
                  {selectedProduct.product.name}
                </h2>

              </div>

              <button
                className="modal-close"
                onClick={() =>
                  setSelectedProduct(null)
                }
              >
                ✕
              </button>

            </div>

            <div className="detail-grid">

              <div className="detail-box">
                <span>Product ID</span>
                <strong>
                  #{selectedProduct.product.id}
                </strong>
              </div>

              <div className="detail-box">
                <span>SKU</span>
                <strong>
                  {selectedProduct.product.sku}
                </strong>
              </div>

              <div className="detail-box">
                <span>Category</span>
                <strong>
                  {selectedProduct.product.category || "-"}
                </strong>
              </div>

              <div className="detail-box">
                <span>Unit Price</span>
                <strong>
                  {money(
                    selectedProduct.product.unit_price
                  )}
                </strong>
              </div>

              <div className="detail-box">
                <span>Current Stock</span>
                <strong>
                  {selectedProduct.product.current_stock}
                </strong>
              </div>

              <div className="detail-box">
                <span>Minimum Stock</span>
                <strong>
                  {selectedProduct.product.min_stock}
                </strong>
              </div>

              <div className="detail-box full-detail">
                <span>Warehouse</span>
                <strong>
                  {selectedProduct.product
                    .warehouse_location || "-"}
                </strong>
              </div>

            </div>

            <div className="history-box">

              <h3>
                📊 Stock Movement History
              </h3>

              {selectedProduct.movements &&
              selectedProduct.movements.length > 0 ? (

                <div className="movement-list">

                  {selectedProduct.movements.map(
                    (movement) => (

                      <div
                        className="movement-item"
                        key={movement.id}
                      >

                        <div>

                          <span
                            className={
                              movement.movement_type ===
                              "IN"
                                ? "movement-in"
                                : "movement-out"
                            }
                          >
                            {movement.movement_type ===
                            "IN"
                              ? "📥 IN"
                              : "📤 OUT"}
                          </span>

                          <strong>
                            {" "}{movement.quantity}
                          </strong>

                        </div>

                        <div>
                          {movement.reason}
                        </div>

                        <small>
                          {formatDateTime(
                            movement.created_at
                          )}
                        </small>

                      </div>

                    )
                  )}

                </div>

              ) : (

                <p className="muted">
                  No stock movements yet.
                </p>

              )}

            </div>

            <div className="modal-footer">

              <button
                className="stock-button large"
                onClick={() => {
                  setSelectedProduct(null);
                  openStockForm(
                    selectedProduct.product
                  );
                }}
              >
                📊 Stock Movement
              </button>

              <button
                className="cancel-button"
                onClick={() =>
                  setSelectedProduct(null)
                }
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

      {/* =================================================
          CHALLANS
      ================================================= */}

      {activePage === "Challans" && (

        <main className="dashboard-content">

          <div className="page-title">

            <h2>
              🚚 Sales Challans
            </h2>

            <p>
              Create, manage and confirm sales challans.
            </p>

          </div>

          <div className="customer-action-bar">

            <button
              className="add-customer-button orange-button"
              onClick={() => {
                resetChallanForm();

                loadCustomers("");
                loadProducts("");

                setShowChallanForm(
                  !showChallanForm
                );
              }}
            >
              ➕ Create Challan
            </button>

            <span>
              Total Challans:
              <strong>
                {" "}{challans.length}
              </strong>
            </span>

          </div>

          {showChallanForm && (

            <div className="form-card">

              <div className="form-heading">

                <div>

                  <span className="form-label-top">
                    SALES
                  </span>

                  <h3>
                    🚚 Create Sales Challan
                  </h3>

                </div>

                <button
                  className="close-button"
                  onClick={() => {
                    resetChallanForm();
                    setShowChallanForm(false);
                  }}
                >
                  ✕
                </button>

              </div>

              <form onSubmit={createChallan}>

                <div className="challan-top-form">

                  <div className="form-group">

                    <label>
                      Customer *
                    </label>

                    <select
                      value={
                        challanForm.customer_id
                      }
                      onChange={(event) =>
                        setChallanForm({
                          ...challanForm,
                          customer_id:
                            event.target.value
                        })
                      }
                      required
                    >

                      <option value="">
                        Select customer
                      </option>

                      {customers.map(
                        (customer) => (

                          <option
                            key={customer.id}
                            value={customer.id}
                          >
                            {customer.name} -{" "}
                            {customer.mobile}
                          </option>

                        )
                      )}

                    </select>

                  </div>

                </div>

                <div className="add-item-box">

                  <h4>
                    ➕ Add Products
                  </h4>

                  <div className="add-item-row">

                    <select
                      value={
                        challanForm.product_id
                      }
                      onChange={(event) =>
                        setChallanForm({
                          ...challanForm,
                          product_id:
                            event.target.value
                        })
                      }
                    >

                      <option value="">
                        Select product
                      </option>

                      {products.map(
                        (product) => (

                          <option
                            key={product.id}
                            value={product.id}
                          >
                            {product.name} |{" "}
                            {product.sku} | Stock:{" "}
                            {product.current_stock}
                          </option>

                        )
                      )}

                    </select>

                    <input
                      type="number"
                      min="1"
                      value={
                        challanForm.quantity
                      }
                      onChange={(event) =>
                        setChallanForm({
                          ...challanForm,
                          quantity:
                            event.target.value
                        })
                      }
                    />

                    <button
                      type="button"
                      className="add-item-button"
                      onClick={addChallanItem}
                    >
                      Add Item
                    </button>

                  </div>

                </div>

                {challanItems.length > 0 && (

                  <div className="challan-items">

                    <h4>
                      Challan Items
                    </h4>

                    <table>

                      <thead>

                        <tr>
                          <th>Product</th>
                          <th>SKU</th>
                          <th>Price</th>
                          <th>Quantity</th>
                          <th>Total</th>
                          <th></th>
                        </tr>

                      </thead>

                      <tbody>

                        {challanItems.map(
                          (item) => (

                            <tr
                              key={item.product_id}
                            >

                              <td>
                                {item.product_name}
                              </td>

                              <td>
                                {item.sku}
                              </td>

                              <td>
                                {money(
                                  item.unit_price
                                )}
                              </td>

                              <td>
                                {item.quantity}
                              </td>

                              <td>
                                {money(
                                  item.unit_price *
                                    item.quantity
                                )}
                              </td>

                              <td>

                                <button
                                  type="button"
                                  className="remove-item-button"
                                  onClick={() =>
                                    removeChallanItem(
                                      item.product_id
                                    )
                                  }
                                >
                                  ✕
                                </button>

                              </td>

                            </tr>

                          )
                        )}

                      </tbody>

                    </table>

                    <div className="challan-total">

                      Total Amount:

                      <strong>
                        {money(
                          challanItems.reduce(
                            (total, item) =>
                              total +
                              item.unit_price *
                                item.quantity,
                            0
                          )
                        )}
                      </strong>

                    </div>

                  </div>

                )}

                <div className="form-buttons">

                  <button
                    type="submit"
                    className="save-button"
                  >
                    💾 Create Draft Challan
                  </button>

                  <button
                    type="button"
                    className="cancel-button"
                    onClick={() => {
                      resetChallanForm();
                      setShowChallanForm(false);
                    }}
                  >
                    Cancel
                  </button>

                </div>

              </form>

            </div>

          )}

          <div className="table-card">

            <table>

              <thead>

                <tr>
                  <th>ID</th>
                  <th>Challan Number</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Date</th>
                  <th>Action</th>
                </tr>

              </thead>

              <tbody>

                {challans.length === 0 ? (

                  <tr>

                    <td
                      colSpan="7"
                      className="no-data"
                    >
                      No sales challans found
                    </td>

                  </tr>

                ) : (

                  challans.map((challan) => (

                    <tr key={challan.id}>

                      <td>
                        {challan.id}
                      </td>

                      <td>
                        <strong>
                          {challan.challan_number}
                        </strong>
                      </td>

                      <td>
                        {challan.customer_name ||
                          challan.customer?.name ||
                          "-"}
                      </td>

                      <td>

                        <span
                          className={
                            "challan-status " +
                            challan.status.toLowerCase()
                          }
                        >
                          {challan.status}
                        </span>

                      </td>

                      <td>
                        {challan.created_by_name ||
                          "-"}
                      </td>

                      <td>
                        {formatDateTime(
                          challan.created_at
                        )}
                      </td>

                      <td>

                        {challan.status ===
                        "DRAFT" ? (

                          <button
                            className="confirm-button"
                            onClick={() =>
                              confirmChallan(
                                challan.id
                              )
                            }
                          >
                            ✅ Confirm
                          </button>

                        ) : (

                          <span className="confirmed-text">
                            ✓ Completed
                          </span>

                        )}

                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </main>

      )}

      {/* =================================================
          FOOTER
      ================================================= */}

      <footer className="footer">

        <p>
          Mini ERP + CRM © 2026
          <span> | </span>
          Developed by
          <strong> BHAVADEEP</strong>
        </p>

      </footer>

    </div>
  );
}

export default App;