const User = require ('../schema/User.schema');

const getGreeting = async (req, res) => {

    try{
        const userId = req.user.id;
        
        const user = await User.findById(userId);

        if(!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const fullName = user.name.trim().split(' ');
        const firstName = fullName[0];

        let initials = firstName.charAt(0).toUpperCase();
        if(fullName.length > 1) {
            initials += fullName[1].charAt(0).toUpperCase();
        }

        const hour = new Date().getHours();

    let greeting = "";

    if(hour >= 5 && hour < 12){
        greeting = "morning";
    } else if (hour >= 12 && hour < 16) {
        greeting = "afternoon";
    } else if (hour >= 16 && hour < 20) {
        greeting = "evening";
    } else {
        greeting = "night";
    }

    res.status(200).json({
        greeting,
        firstName,
        initials
    });

    } catch (err) {
        return res.status(500).json({
            message: 'Something is wrong in the universe',
            error: err.message,
        })
    }

};

module.exports = {getGreeting};