const express = require('express');

const isValidName = (name) => /^[A-Za-z\s]+$/.test(name);

const isValidPassword = (password) => /^(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/.test(password);

const isValidMobile = (mobile) => /^(\+?\d{10,13})$/.test(mobile);

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

module.exports = { isValidName, isValidPassword, isValidMobile, isValidEmail };
