import User from "../models/userModels.js";
import PaperPresentation from "../models/paperPresentationModel.js";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "avalanche25@git.edu",
    pass: "rmwdnakckgwuxoxd",
  },
});

const sendRegistrationEmail = async (teamEmails, department) => {
  const html = `
    <h2>🚀 Avalanche 2025 - Paper Presentation Registration</h2>
    <p>Your team has been successfully registered under the <b>${department}</b> department.</p>
    <p>We look forward to your participation!</p>
  `;
  await transporter.sendMail({
    from: `"Avalanche 2025 ❄️" <avalanche25@git.edu>`,
    to: teamEmails.join(","),
    subject: "Paper Presentation Registration Confirmation",
    html,
  });
};

export const registerTeam = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { department, teamMembers, mode } = req.body;

    if (!department || !teamMembers?.length) {
      return res.status(400).json({
        message: "Department and team members are required.",
      });
    }

    const departments = [
      "Aeronautical", "Architecture", "Physics", "Chemistry", "B. Sc. (PCM)", "Mathematics",
      "Civil Engineering", "Computer Science", "Electronics & Communications (EC)",
      "Information Science (IS)", "MBA", "MCA", "Mechanical Engineering", "AI-ML",
    ];

    if (!departments.includes(department)) {
      return res.status(400).json({ message: "Invalid department." });
    }

    const team = [];
    for (let id of teamMembers) {
      const user = await User.findById(id);
      if (!user)
        return res.status(404).json({ message: `User ${id} not found.` });
      if (!user.isVerified)
        return res.status(400).json({ message: `${user.name} is not verified.` });
      if (!user.payment)
        return res.status(400).json({ message: `${user.name} has not paid.` });

      team.push({
        userId: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        payment: user.payment,
      });
    }

    const registration = new PaperPresentation({
      eventId,
      department,
      team,
      mode,
    });
    await registration.save();

    const emails = team.map((t) => t.email);
    await sendRegistrationEmail(emails, department);

    res.status(200).json({
      message: "Team successfully registered.",
      registration,
    });
  } catch (error) {
    console.error("Error in registerTeam:", error.message);
    res.status(500).json({ message: "Server error." });
  }
};
