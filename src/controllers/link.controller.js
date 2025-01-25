const Link = require('../schema/Link.schema');
const express = require('express');
const dotenv = require('dotenv');
const device = require('express-device');
const crypto = require('crypto');
const validator = require('validator');


dotenv.config();

const createShortURL = async (req, res) => {
    const {originalURL, expirationDate, remarks} = req.body;

    if(!originalURL) {
        return res.status(400).json({message: 'Destination is required !!'});
    }

    if (!validator.isURL(originalURL)) {
        return res.status(400).json({ message: 'Invalid URL format' });
    }

    try {
        const shortURL = crypto.randomBytes(4).toString('hex');

        const newLink = new Link({
            originalURL,
            shortURL,
            expirationDate,
            remarks,
            createdBy: req.user.id,
        });

        await newLink.save();

        return res.status(201).json({
            message: 'Short URL created successfully !!',
            shortURL: `${req.protocol}://${req.get('host')}/${shortURL}`
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: 'Internal Server Error'
        });
    }
};

const getLinks = async (req, res) => {
    try {
        const links = await Link.find({
            createdBy: req.user.id
        });

        const updatedLinks = links.map(link => ({
            ...link._doc,
            status: link.expirationDate && new Date() > link.expirationDate ? "inactive" : "active"
        }));

        return res.status(200).json({
            links
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: 'Internal Server Error'
        });
    }
};

const redirectToOriginal = async (req, res) => {
    try{
        const {shortURL} = req.params;

        const link = await Link.findOne({shortURL});

        if (link.expirationDate && new Date() > link.expirationDate) {
            return res.status(410).json({ message: "This link has expired" });
        }        

        if (!link || link.status === 'inactive') {
            return res.status(404).json({ message: "This link is no more :(" });
        }

        link.clicks.push({
            ip: req.ip,
            timestamp: new Date(),
            device: req.device.type,
        });

        link.totalClicks += 1;
        await link.save();

        res.redirect(link.originalURL);

    }  catch (err) {
        res.status(500).json({
            message: 'Internal Server Error',
            error: err
        });
    }
};

const getLinkAnalytics = async (req, res) => {
    try{
        const {shortURL} = req.params;
        const link = await Link.findOne({shortURL});

        if (!link) {
            return res.status(404).json({ error: 'Short URL not found' });
        }

        const deviceAnalytics = link.clicks.reduce((acc, click) => {
            acc[click.device] = (acc[click.device] || 0) + 1;
            return acc;
        }, { mobile: 0, desktop: 0, tablet: 0 });

        const dateAnalytics = link.clicks.reduce((acc, click) => {
            const date = click.timestamp.toISOString().split("T")[0]; // Extract date (YYYY-MM-DD)
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});

        res.status(200).json({
            originalURL: link.originalURL,
            shortURL: link.shortURL,
            totalClicks: link.clicks.length,
            clicks: link.clicks,
            deviceAnalytics,
            dateAnalytics
        });

    } catch (err) {
        res.status(500).json({
            error: 'Internal Server Error'
        });
    }
};

const updateLink = async (req, res) => {
    const { shortURL } = req.params;
    const { originalURL, expirationDate, remarks } = req.body;

    try {
        const link = await Link.findOne({ shortURL });

        if (!link) {
            return res.status(404).json({ message: "Link not found" });
        }

        link.originalURL = originalURL || link.originalURL;
        link.expirationDate = expirationDate || link.expirationDate;
        link.remarks = remarks || link.remarks;

        await link.save();

        return res.status(200).json({ message: "Link updated successfully" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};

const deleteLink = async (req, res) => {
    const { shortURL } = req.params;

    try {
        const link = await Link.findOneAndDelete({ shortURL });

        if (!link) {
            return res.status(404).json({ message: "Link not found" });
        }

        return res.status(200).json({ message: "Link deleted successfully" });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal Server Error" });
    }
};


module.exports = {createShortURL, getLinks, getLinkAnalytics, redirectToOriginal, updateLink, deleteLink};


