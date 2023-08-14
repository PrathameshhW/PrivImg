const express = require('express');
const router = express.Router();
const { connect } = require('../config/config')
const Auth = require('../config/auth');
const preAuth = require('../config/preauth');
const bcrypt = require('bcrypt');
const User = require('../config/model/user')
const jwt = require('jsonwebtoken');
/* GET users listing. */

connect();

router.route('/auth/login')
  .get(preAuth, (req, res, next) => {
    res.render('auth/login', { title: "Login" });
  })
  .post(async (req, res, next) => {
    const { email, password } = req.body;
    console.log(req.body);
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.render('auth/login', { title: "Login", error: "Invalid email or password" });
      }

      const passwordMatch = await bcrypt.compare(password, user.password);
      if (!passwordMatch) {
        return res.render('auth/login', { title: "Login", error: "Invalid email or password" });
      }

      // Create a JWT token
      const token = jwt.sign({ userId: user._id }, 'Tatakae', { expiresIn: '1h' });

      // Set the token as a cookie or in the response header as needed
      res.cookie('token', token); // You can also use res.setHeader('Authorization', `Bearer ${token}`);

      res.redirect('/user/dashboard'); // Redirect to the dashboard after successful login
    } catch (error) {
      next(error); // Pass the error to the error handling middleware
    }
  });

router.route('/auth/register')
  .get((req, res, next) => {
    res.render('auth/register', { title: "Register" });
  })
  .post(async (req, res, next) => {
    const { email, password } = req.body;
    console.log(req.body);
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = new User({ email, password: hashedPassword });
      await newUser.save();

      res.redirect('/user/auth/login'); // Redirect to the login page after successful registration
    } catch (error) {
      next(error); // Pass the error to the error handling middleware
    }
  });


router.route('/dashboard')
  .get(Auth, (req, res) => {
    // You can access req.userId here, which contains the authenticated user's ID
    res.render('user/dashboard', { title: 'Dashboard' });
  });


// ? logout
router.get('/auth/logout', (req, res) => {
  // Clear the token from the client's browser by setting it to an expired value
  res.clearCookie('token');
  // Redirect to a desired location after logout
  res.redirect('/user/auth/login');
});

module.exports = router;
