const express = require('express');
const bcrypt = require('bcrypt');   
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const auth = require('../middlewares/auth.middleware');
const User = require('../schema/User.schema');

dotenv.config();

const signup = async(req, res) => {
    const {name, email, mobile, password, confirmPassword} = req.body;

    if (!name || !email || !password){
        return res.status(400).json({message: "Please fill in all details"});
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMobile = mobile.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if(trimmedPassword !== trimmedConfirmPassword) {
        return res.status(400).json({message: "Enter same password in both fields"});
    }

    try{
        const isEmailRegistered = await User.findOne({email : trimmedEmail});

        if (isEmailRegistered) {
            return res.status(400).json({message: "Email already registered"});
        }

        const isMobileRegistered = await User.findOne({mobile : trimmedMobile});

        if (isMobileRegistered) {
            return res.status(400).json({message: "Email already registered"});
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(trimmedPassword, salt);

        const newUser = new User({
            name: trimmedName,
            email: trimmedEmail,
            mobile: trimmedMobile,
            password: hashedPassword
        });

        await newUser.save();

        return res.status(201).json({message: "User Created Successfully !!"});
    } catch (err) {
        console.log(err);
        return res.status(400).json({
            message: "Error Occured while creating user"
        })
    }
};

const login = async (req, res) => {
    const {email, password} = req.body;

    if(!email || !password) {
        return res.status(400).json({ message: "Please enter email and password" });
    }

    try{
        const user = await User.findOne({email});

        if(!user){
            return res.status(401).json({message: "Invalid Credentials"});    
        };

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({message: "Invalid Credentials"});
        };

        const payload = {
            id: user._id,
            email: user.email
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '72h'
        });

        return res.status(200).json({
            message: 'Login Successfull',
            token,
            user: {
                id: user._id,
                email: user.email
            }
        });

    } catch (err) {
        console.log(err)
        return res.status(500).json({message: "Internal Server Error"});
    }
};

module.exports = {signup, login}
