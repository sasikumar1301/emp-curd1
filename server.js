const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const multer = require('multer'); // For file upload
const path = require('path'); // To handle file paths
const bcrypt = require('bcryptjs');
require('dotenv').config();

const Admin = require('./models/Admin'); // Import Admin model
const Employee = require('./models/Employee'); // Import Employee model

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // Static folder for image access

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB Connected'))
.catch(err => console.log(err));

// Multer Configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, new Date().toISOString().replace(/:/g, '-') + '-' + file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        const fileTypes = /jpeg|jpg|png/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only images are allowed!'));
        }
    }
});

// Admin Registration (Optional)
app.post('/api/admin/register', async (req, res) => {
    const { email, password } = req.body;

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = new Admin({ email, password: hashedPassword });

    await newAdmin.save();
    res.status(201).json({ message: 'Admin registered successfully!' });
});

// Admin Login
app.post('/api/admin/login', async (req, res) => {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email });

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
        return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: admin._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token });
});
const jwt = require('jsonwebtoken'); // Add this import at the top with other imports

// Mock admin credentials
const adminCredentials = {
    email: 'admin@example.com',
    password: 'admin123', // In production, store hashed passwords!
};

// Admin Login Route
app.post('/api/admin/login', (req, res) => {
    const { email, password } = req.body;

    // Validate credentials
    if (email === adminCredentials.email && password === adminCredentials.password) {
        const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' }); // Create a token
        return res.json({ token }); // Return the token
    } else {
        return res.status(401).json({ message: 'Invalid credentials' }); // Unauthorized
    }
});


// Middleware to authenticate JWT
const authenticateJWT = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1]; // Get token from Authorization header

    if (!token) {
        return res.sendStatus(403);
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.sendStatus(403);
        }
        req.user = user; // Add user info to request object
        next();
    });
};

// Employee Schema and Model
app.post('/api/employees', upload.single('profilePic'), async (req, res) => {
    const { name, email, mobileNo, designation, gender, courses } = req.body;
    const profilePic = req.file ? req.file.path : null; // Store file path
    
    const newEmployee = new Employee({
        name,
        email,
        mobileNo,
        designation,
        gender,
        courses: courses.split(','), // Convert comma-separated courses to an array
        profilePic
    });
    
    await newEmployee.save();
    res.status(201).json(newEmployee);
});

// Update Employee (with profile picture)
app.put('/api/employees/:id', upload.single('profilePic'), async (req, res) => {
    const { name, email, mobileNo, designation, gender, courses } = req.body;
    const profilePic = req.file ? req.file.path : null;

    const updatedEmployee = await Employee.findByIdAndUpdate(req.params.id, {
        name,
        email,
        mobileNo,
        designation,
        gender,
        courses: courses.split(','), 
        ...(profilePic && { profilePic }) // Update profile picture only if new file is uploaded
    }, { new: true });

    res.status(200).json(updatedEmployee);
});

// Other routes for fetching and deleting employees
app.get('/api/employees', async (req, res) => {
    const employees = await Employee.find();
    res.status(200).json(employees);
});

app.get('/api/employees/:id', async (req, res) => {
    const employee = await Employee.findById(req.params.id);
    res.status(200).json(employee);
});

app.delete('/api/employees/:id', async (req, res) => {
    await Employee.findByIdAndDelete(req.params.id);
    res.status(204).json({ message: 'Employee deleted' });
});

// Admin route to get all employees (protected)
app.get('/api/admin/employees', authenticateJWT, async (req, res) => {
    const employees = await Employee.find();
    res.status(200).json(employees);
});


// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
