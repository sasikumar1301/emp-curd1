const express = require('express');
const router = express.Router();
const Employee = require('../models/Employee');
const multer = require('multer');
const path = require('path');

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

// Add Employee (with profile picture)
router.post('/', upload.single('profilePic'), async (req, res) => {
    const { name, email, mobileNo, designation, gender, courses } = req.body;
    const profilePic = req.file ? req.file.path : null;

    const newEmployee = new Employee({
        name,
        email,
        mobileNo,
        designation,
        gender,
        courses: courses.split(','),
        profilePic
    });

    await newEmployee.save();
    res.status(201).json(newEmployee);
});

// Other employee routes...

module.exports = router;
