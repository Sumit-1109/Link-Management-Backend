const device = require("express-device");
const userAgent = require("express-useragent");

const deviceType = (req, res, next) => {

  let device = "Unknown";

  if (req.device && req.device.type) {
    switch (req.device.type) {
      case "phone":
        device = "Mobile";
        break;
      case "desktop":
        device = "Desktop";
        break;
      case "tablet":
        device = "Tablet";
        break;
    }
  }

  const browser = req.useragent.browser || "Unknown";

  req.clientInfo = {device, browser};

  next();
};

module.exports = deviceType;
