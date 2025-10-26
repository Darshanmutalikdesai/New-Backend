import User from "../models/userModels.js";
import PaperPresentation from "../models/paperPresentationModel.js";
import nodemailer from "nodemailer";

// transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "avalanche25@git.edu",
    pass: "rmwdnakckgwuxoxd",
  },
});

const sendRegistrationEmail = async (teamEmails, department) => {
  const html = `<h2>🚀 Avalanche 2025 Paper Presentation Registration</h2>
                <p>Your team has been successfully registered for <b>${department}</b> department.</p>`;
  await transporter.sendMail({
    from: `"Avalanche 2025 ❄️" <avalanche25@git.edu>`,
    to: teamEmails.join(","),
    subject: "Paper Presentation Registration Confirmed",
    html,
  });
};

// 📝 Register Team
export const registerTeam = async (req, res) => {
  try {
    const { department, teamMembers, mode } = req.body;

    if (!department || !teamMembers || teamMembers.length === 0)
      return res.status(400).json({ message: "Department and team members are required." });

    // Check department is valid
    const departments = [
      "Aeronautical", "Architecture", "Physics", "Chemistry", "B. Sc. (PCM)",
      "Mathematics", "Civil Engineering", "Computer Science",
      "Electronics & Communications (EC)", "Information Science (IS)",
      "MBA", "MCA", "Mechanical Engineering", "AI-ML"
    ];
    if (!departments.includes(department))
      return res.status(400).json({ message: "Invalid department." });

    // Check all members exist and are verified & paid
    const team = [];
    for (let id of teamMembers) {
      const user = await User.findById(id);
      if (!user) return res.status(404).json({ message: `User ${id} not found.` });
      if (!user.isVerified) return res.status(400).json({ message: `User ${user._id} is not verified.` });
      if (!user.payment) return res.status(400).json({ message: `User ${user._id} has not completed payment.` });

      team.push({
        userId: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        payment: user.payment,
      });
    }

    // Save Paper Presentation registration
    const registration = new PaperPresentation({ department, team, mode });
    await registration.save();

    // Send email to all team members
    const emails = team.map(t => t.email);
    await sendRegistrationEmail(emails, department);

    res.status(200).json({
      message: "Team successfully registered for Paper Presentation.",
      registration,
    });
  } catch (error) {
    console.error("Error in registerTeam:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};
