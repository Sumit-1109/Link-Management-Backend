const express = require('express');
const bcrypt = require('bcrypt');   
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const auth = require('../middlewares/auth.middleware');
const User = require('../schema/User.schema');
const Links = require('../schema/Link.schema');

dotenv.config();

const signup = async(req, res) => {
    const {name, email, mobile, password, confirmPassword} = req.body;

    if (!name || !email || !mobile || !password || !confirmPassword) {
        return res.status(400).json({message: "Don't Leave Us Guessing"});
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedMobile = mobile.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if(trimmedPassword !== trimmedConfirmPassword) {
        return res.status(401).json({message: "Password twin trouble"});
    }

    try{
        const isEmailRegistered = await User.findOne({email : trimmedEmail});

        if (isEmailRegistered) {
            return res.status(400).json({message: "Email's taken"});
        }

        const isMobileRegistered = await User.findOne({mobile : trimmedMobile});

        if (isMobileRegistered) {
            return res.status(400).json({message: "Mobile's taken"});
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

        return res.status(201).json({message: "Welcome Aboard"});
    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "User creation Fiasco"
        })
    }
};

const login = async (req, res) => {
    const {email, password} = req.body;

    if(!email || !password) {
        return res.status(400).json({ message: "Don't leave us guessing" });
    }

    try{
        const user = await User.findOne({email});

        if(!user){
            return res.status(401).json({message: "Sus!! Wrong combo!!"});    
        };

        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({message: "Sus!! Wrong combo!!"});
        };

        const payload = {
            id: user._id,
            email: user.email
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, {
            expiresIn: '72h'
        });

        return res.status(200).json({
            message: "You're in",
            token,
            user: {
                id: user._id,
                email: user.email
            }
        });

    } catch (err) {
        console.log(err)
        return res.status(500).json({message: "Server took a nap"});
    }
};

const modify = async (req, res) => {
    const {name, mobile, email} = req.body;

    if(!req.user.id){
        return res.status(401).json({message: "Imposter alert"});
    }

    try{
        const user = await User.findById(req.user.id);

        if(!user){
            return res.status(404).json({message: "User Missing!!"});
        }

        const emailChanged= user.email !== email;
        const nameChanged = user.name !== name;

        user.name = name,
        user.mobile = mobile,
        user.email = email;

        await user.save();

        return res.status(200).json({
            message: "User Makeover Done",
            emailChanged,
            nameChanged,
            userDetails: {
                name: user.name,
                email: user.email,
                mobile: user.mobile,
            },
        });

    } catch (err){
        return res.status(500).json({
            message: "Server took a nap",
            error: err
        })
    }
};

const deleteUser = async (req, res) => {
    if (!req.user.id) {
        return res.status(401).json({
            message: "Imposter Alert"
        });
    }

    try{

        await Links.deleteMany({
            createdBy: req.user.id
        });

        await User.findByIdAndDelete(req.user.id);

        return res.status(200).json({
            message: `Adios`
        });

    } catch (err) {
        return res.status(500).json({
            message: 'Deletion Derailed',
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
                message: "User Who ?"
            });
        };

        return res.status(200).json({user});

    } catch (err) {
        return res.status(500).json({
            message: 'Server is taking a nap',
            error : err.message
        })
    }
}

const getUserName = async (req, res) => {

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
                message: "User Who ?"
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
            message: 'Server is taking a nap',
            error : err.message
        })
    }
}

module.exports = {signup, login, modify, deleteUser, getUserDetails, getUserName};
