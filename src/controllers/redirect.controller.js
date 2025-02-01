const Link = require("../schema/Link.schema");
const express = require("express");
const dotenv = require("dotenv");
const device = require("express-device");
const userAgent = require("express-useragent");

dotenv.config();

const redirectToOriginal = async (req, res) => {

    const { shortURL } = req.params;

    if(!shortURL) {
        return res.status(400).json({ message: "No URL" });
    }

  try {
    const link = await Link.findOne({ shortURL });

    if (!link) {
      console.log(`Link not found for shortURL: ${shortURL}`);
    return res.status(404).json({ message: "This link is no more :(" });
  }

    if (link.expirationDate && new Date() > link.expirationDate) {
      return res.status(410).json({ message: "This link is no more :(" });
    }


    const {device, userDevice, browser, ip} = req.clientInfo;

    const clickData = {
      ip: ip,
      timestamp: new Date(),
      device: device,
      userDevice: userDevice,
    };

    console.log("Click Data", clickData);

    const updatedLink = await Link.findOneAndUpdate(
      { shortURL },
      {
        $inc: { totalClicks: 1 },
        $push: { clicks: clickData },
      },
      {
        new: true,
      }
    );

    if (!updatedLink) {
      return res.status(500).json({ message: "Failed to update" });
    }

    const redirectURL = link.originalURL.startsWith('http://') || link.originalURL.startsWith('https://') ? link.originalURL : `http://${link.originalURL}`;

    res.redirect(redirectURL);

  } catch (err) {
    res.status(500).json({
      message: "Internal Server Error",
      error: err,
    });
  }
};

module.exports = {
  redirectToOriginal,
};
