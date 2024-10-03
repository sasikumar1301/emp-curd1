const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    name: String,
    email: String,
    mobileNo: String, // New field for Mobile Number
    designation: String, // Dropdown options: HR, Manager, Sales
    gender: String, // Radio button options: Male, Female, Other
    courses: [String], // Checkbox options: MCA, BCA, BSC
    profilePic: String, // Profile picture (jpg or png)
});

module.exports = mongoose.model('Employee', employeeSchema);
