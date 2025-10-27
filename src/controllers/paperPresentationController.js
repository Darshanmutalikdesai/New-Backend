// src/controllers/paperController.js
import User from "../models/userModels.js";
import PaperPresentation from "../models/paperPresentationModel.js";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "avalanche25@git.edu",
    pass: "rmwdnakckgwuxoxd", // 🔒 App password
  },
});

const sendRegistrationEmail = async (teamEmails, department) => {
  const html = `
    <h2>🚀 Avalanche 2025 Paper Presentation Registration</h2>
    <p>Your team has been successfully registered for <b>${department}</b> department.</p>
    <p>Thank you for participating in Avalanche 2025!</p>
  `;
  
  try {
    await transporter.sendMail({
      from: `"Avalanche 2025 ❄️" <avalanche25@git.edu>`,
      to: teamEmails.join(","),
      subject: "Paper Presentation Registration Confirmed",
      html,
    });
    console.log("✅ Email sent to:", teamEmails.join(", "));
  } catch (error) {
    console.error("❌ Email sending failed:", error);
  }
};

// 📝 Register Team
export const registerTeam = async (req, res) => {
  try {
    const { department, teamMembers, mode } = req.body;

    // Validation
    if (!department) {
      return res.status(400).json({ message: "Department is required." });
    }

    if (!teamMembers || !Array.isArray(teamMembers) || teamMembers.length === 0) {
      return res.status(400).json({ message: "At least one team member is required." });
    }

    if (!mode) {
      return res.status(400).json({ message: "Mode (Online/Offline) is required." });
    }

    const validDepartments = [
      "Aeronautical",
      "Architecture",
      "Physics",
      "Chemistry",
      "B. Sc. (PCM)",
      "Mathematics",
      "Civil Engineering",
      "Computer Science",
      "Electronics & Communications (EC)",
      "Information Science (IS)",
      "MBA",
      "MCA",
      "Mechanical Engineering",
      "AI-ML",
    ];

    if (!validDepartments.includes(department)) {
      return res.status(400).json({ message: "Invalid department selected." });
    }

    const team = [];

    // Validate each team member
    for (let identifier of teamMembers) {
      if (!identifier || identifier.trim() === "") continue;

      const trimmedId = identifier.trim();
      let user = null;

      // Try to find user by MongoDB _id first
      try {
        user = await User.findById(trimmedId);
      } catch (err) {
        // Not a valid ObjectId, continue to other methods
      }

      // If not found by _id, try by avalancheId field
      if (!user) {
        user = await User.findOne({ avalancheId: trimmedId });
      }

      // If still not found, try by rollNumber
      if (!user) {
        user = await User.findOne({ rollNumber: trimmedId });
      }

      // If still not found, try by email
      if (!user) {
        user = await User.findOne({ email: trimmedId });
      }

      console.log("🔍 Searching for:", trimmedId);
      console.log("🔍 User found:", user ? "YES" : "NO");
      
      if (!user) {
        return res.status(404).json({ 
          message: `User with ID "${trimmedId}" not found. Please check the ID or ensure the user is registered.` 
        });
      }

      // Get the user's unique identifier (prefer avalancheId, fallback to _id)
      const userIdentifier = user.avalancheId || user._id.toString();

      // Check payment status (support both 'payment' and 'hasPaid' fields)
      const hasCompletedPayment = user.payment || user.hasPaid || false;

      console.log("👤 User details:", {
        name: user.name,
        email: user.email,
        identifier: userIdentifier,
        isVerified: user.isVerified,
        payment: user.payment,
        hasPaid: user.hasPaid,
        hasCompletedPayment: hasCompletedPayment
      });

      if (!user.isVerified) {
        return res.status(400).json({ 
          message: `User ${user.name} is not verified. Please verify email first.` 
        });
      }

      if (!hasCompletedPayment) {
        return res.status(400).json({ 
          message: `User ${user.name} has not completed payment. Please complete payment first.` 
        });
      }

      // Check if user already registered for this department
      // Use string comparison for avalancheId to avoid ObjectId casting errors
      let existingRegistration = null;
      try {
        existingRegistration = await PaperPresentation.findOne({
          department: department,
          "team.avalancheId": { $in: [userIdentifier, user._id.toString()] }
        });
      } catch (err) {
        // If the query fails, try a simpler approach
        console.log("⚠️ First duplicate check failed, trying alternative method");
        const allRegistrations = await PaperPresentation.find({ department: department });
        existingRegistration = allRegistrations.find(reg => 
          reg.team.some(member => 
            member.avalancheId === userIdentifier || 
            member.avalancheId === user._id.toString() ||
            (member.userId && member.userId.toString() === user._id.toString())
          )
        );
      }

      if (existingRegistration) {
        return res.status(400).json({
          message: `User ${user.name} is already registered for ${department} department.`,
        });
      }

      // Add to team array - store _id as ObjectId and userIdentifier as string
      const teamMember = {
        userId: user._id, // Always store the MongoDB ObjectId here
        avalancheId: userIdentifier, // Store the display identifier (can be "ava0018" etc)
        name: user.name,
        email: user.email,
        isVerified: user.isVerified,
        hasPaid: hasCompletedPayment,
      };
      
      console.log("📦 Adding team member:", teamMember);
      team.push(teamMember);
    }

    if (team.length === 0) {
      return res.status(400).json({ message: "No valid team members found." });
    }

    console.log("📝 Creating registration with team:", JSON.stringify(team, null, 2));
    console.log("📝 Team member types:", team.map(m => ({
      name: m.name,
      userIdType: typeof m.userId,
      userIdValue: m.userId,
      avalancheIdType: typeof m.avalancheId,
      avalancheIdValue: m.avalancheId
    })));

    // Create registration
    let registration;
    try {
      registration = new PaperPresentation({ 
        department, 
        team, 
        mode 
      });
      
      console.log("💾 About to save registration...");
      await registration.save();
      console.log("✅ Registration saved successfully");
    } catch (saveError) {
      console.error("❌ Error saving registration:", saveError);
      console.error("❌ Error name:", saveError.name);
      console.error("❌ Full error:", JSON.stringify(saveError, null, 2));
      return res.status(500).json({ 
        message: "Failed to save registration. Please check your data.",
        error: saveError.message,
        details: saveError.errors ? Object.keys(saveError.errors).map(key => ({
          field: key,
          message: saveError.errors[key].message
        })) : []
      });
    }

    // Update users' registered events
    for (let member of team) {
      await User.findByIdAndUpdate(
        member.userId,
        { 
          $addToSet: { 
            registeredEvents: `Paper Presentation - ${department}` 
          } 
        }
      );
    }

    // Send confirmation emails
    const emails = team.map((t) => t.email);
    await sendRegistrationEmail(emails, department);

    res.status(200).json({
      message: "Team successfully registered for Paper Presentation!",
      registration: {
        department: registration.department,
        mode: registration.mode,
        team: registration.team,
        registeredAt: registration.createdAt,
      },
    });
  } catch (error) {
    console.error("❌ Error in registerTeam:", error);
    res.status(500).json({ 
      message: "Server error occurred during registration.",
      error: error.message 
    });
  }
};

// 📋 Get all registrations (optional - for admin)
export const getAllRegistrations = async (req, res) => {
  try {
    const registrations = await PaperPresentation.find()
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      message: "Registrations fetched successfully",
      count: registrations.length,
      registrations,
    });
  } catch (error) {
    console.error("Error fetching registrations:", error);
    res.status(500).json({ message: "Server error." });
  }
};

// 📋 Get registrations by department (optional)
export const getRegistrationsByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    
    const registrations = await PaperPresentation.find({ department })
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      message: `Registrations for ${department} fetched successfully`,
      count: registrations.length,
      registrations,
    });
  } catch (error) {
    console.error("Error fetching registrations:", error);
    res.status(500).json({ message: "Server error." });
  }
};