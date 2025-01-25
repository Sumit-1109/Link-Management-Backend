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

    if (!name || !email || !mobile || !password || !confirmPassword) {
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
            return res.status(400).json({message: "Mobile already registered"});
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

const modify = async (req, res) => {
    const {name, mobile, email} = req.body;

    console.log(req);
    console.log(req.user);
    console.log(req.user.id);
    if(!req.user.id){
        return res.status(401).json({message: "Unauthorized Access"});
    }

    try{
        const user = await User.findById(req.user.id);

        if(!user){
            return res.status(404).json({message: "User Not Found"});
        }

        if (name){
            if ( name === user.name){
                return res.status(400).json({message: "New and existing name are the same"});
            }

            user.name = name;
        }

        if (mobile){
            if (mobile === user.mobile){
                return res.status(400).json({message: "New and existing mobile are the same"});
            }

            doesMobileExist = await User.findOne({mobile: mobile}).exec();

            if(doesMobileExist){
                return res.status(400).json({message: "Mobile Number is already in use"});
            }

            user.mobile = mobile;
        }

        if (email){
            if (email === user.email){
                return res.status(400).json({message: "New and existing email are the same"});
            }

            doesEmailExist = await User.findOne({email: email}).exec();

            if(doesEmailExist){
                return res.status(400).json({message: "Email is already in use"});
            }

            user.email = email;
        }

        await user.save();

        return res.status(200).json({
            message: "User Details Updated Successfully",
            user
        });

    } catch (err){
        return res.status(500).json({
            message: "Internal Server Error",
            error: err
        })
    }
};

const deleteUser = async (req, res) => {
    if (!req.user.id) {
        return res.status(401).json({
            message: "Unauthorized Access"
        });
    }

    try{
        await User.findByIdAndDelete(req.user.id);

        return res.status(200).json({
            message: "Account Deleted Successfully"
        });

    } catch (err) {
        return res.status(500).json({
            message: 'Failer to delete account.',
            error: err
        })
    }
};

const getUserDetails = async (req, res) => {

    const userId = req.user.id;

    if (!userId) {
        return res.status(401).json({
            message: "Login !! Get a token man !!"
        });
    }

    try{
        const user = await User.findById(userId);

        if(!user) {
            return res.status(404).json({
                message: "User Not Found"
            });
        };

        const fullName = user.name.trim().split(' ');
        const firstName = fullName[0];

        let initials = firstName.charAt(0).toUpperCase();
        if(fullName.length > 1) {
            initials += fullName[1].charAt(0).toUpperCase();
        }

        return res.status(200).json({
            firstName,
            initials
        });

    } catch (err) {
        return res.status(500).json({
            message: 'Something is wrong with the universe',
            error : err.message
        })
    }
}

module.exports = {signup, login, modify, deleteUser, getUserDetails};
