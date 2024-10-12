export const sendNotification = async (req, res) => {
    const { driverId, notification } = req.body;
    
    try {
        const driver = await Driver.findById(driverId);
        if (!driver) {
        return res.status(404).json({ message: "Driver not found" });
        }
    
        // Send notification to driver
        // This is a placeholder for sending notifications to drivers
        console.log(`Sending notification to driver ${driver.name}`);
        console.log(notification);
    
        return res.json({ message: "Notification sent successfully" });
    } catch (error) {
        console.error(error);
        return res
        .status(500)
        .json({ message: "An error occurred while sending notification" });
    }
    }

export const sendEmail = async (req, res) => {
    const { email, subject, message } = req.body;
    
    try {
        // Send email
        // This is a placeholder for sending emails
        console.log(`Sending email to ${email}`);
        console.log(`Subject: ${subject}`);
        console.log(`Message: ${message}`);
    
        return res.json({ message: "Email sent successfully" });
    } catch (error) {
        console.error(error);
        return res
        .status(500)
        .json({ message: "An error occurred while sending email" });
    }
    }