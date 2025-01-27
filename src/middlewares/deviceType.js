const deviceType = (req, res, next) => {
  if (req.device && req.device.type) {
    switch (req.device.type) {
      case "phone":
        req.device.type = "Mobile";
        break;
      case "desktop":
        req.device.type = "Desktop";
        break;
      case "tablet":
        req.device.type = "Tablet";
        break;
    }
  }

  next();
};

module.exports = deviceType;
