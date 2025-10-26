import Event from "../models/eventModel.js";
import User from "../models/userModels.js";
import nodemailer from "nodemailer";

// Mail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "avalanche25@git.edu",
    pass: "rmwdnakckgwuxoxd"
  }
});

// HTML Email
const spaceMail = (title, message, eventName, userName, avalancheId) => `
<div style="font-family: 'Poppins', sans-serif; background: #141a2a; color: #e0e0e0; padding: 40px; border-radius: 12px; max-width: 600px; margin: auto;">
  <h1 style="color: #00ffff;">${title}</h1>
  <p>${message}</p>
  <h3>Event: ${eventName}</h3>
  <p>Your Avalanche ID: <b>${avalancheId}</b></p>
  <p>See you at Avalanche 2025 🚀</p>
</div>
`;

// Register for event (solo/team)
export const registerForEvent = async (req, res) => {
  try {
    const { avalancheId, teamName, members } = req.body;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: "Event not found" });

    // SOLO
    if (event.type === "solo") {
      if (!avalancheId) return res.status(400).json({ message: "Avalanche ID required" });

      const user = await User.findById(avalancheId);
      if (!user || !user.isVerified) return res.status(400).json({ message: "Invalid or unverified Avalanche ID" });
      if (!user.payment) return res.status(400).json({ message: "Payment not completed" });

      const already = event.participants.some(p => p.avalancheId === user._id.toString());
      if (already) return res.status(400).json({ message: "Already registered" });

      event.participants.push({ avalancheId: user._id, name: user.name, email: user.email, department: user.department });
      await event.save();

      await transporter.sendMail({
        from: `"Avalanche 2025 ❄️" <avalanche25@git.edu>`,
        to: user.email,
        subject: `✅ Registered for ${event.name}`,
        html: spaceMail("REGISTRATION CONFIRMED", "You are successfully registered!", event.name, user.name, user._id)
      });

      return res.status(200).json({ message: "Solo registration successful", eventId: event._id });
    }

    // TEAM (2–4 members)
    else {
      if (!teamName || !members || members.length < 2 || members.length > 4)
        return res.status(400).json({ message: "Team must have 2–4 members" });

      const memberData = await Promise.all(members.map(id => User.findById(id)));
      const invalidMembers = memberData.map((u, i) => u && u.isVerified && u.payment ? null : members[i]).filter(x => x);
      if (invalidMembers.length > 0)
        return res.status(400).json({ message: `Invalid/unverified/not paid IDs: ${invalidMembers.join(", ")}` });

      const alreadyTeam = event.teams.some(team =>
        team.members.some(m => members.includes(m.avalancheId))
      );
      if (alreadyTeam) return res.status(400).json({ message: "One or more members already registered" });

      const newTeam = {
        teamName,
        members: memberData.map(u => ({ avalancheId: u._id, name: u.name, email: u.email, department: u.department }))
      };

      event.teams.push(newTeam);
      await event.save();

      // Notify all members
      await Promise.all(memberData.map(u => transporter.sendMail({
        from: `"Avalanche 2025 ❄️" <avalanche25@git.edu>`,
        to: u.email,
        subject: `✅ Team Registered for ${event.name}`,
        html: spaceMail("TEAM REGISTRATION CONFIRMED", `Your team ${teamName} is registered for ${event.name}.`, event.name, u.name, u._id)
      })));

      return res.status(200).json({ message: "Team registered successfully", eventId: event._id });
    }
  } catch (error) {
    console.error("Error registering:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Export CSV by event or department
export const exportCSV = async (req, res) => {
  try {
    const { eventId, department } = req.query;
    let participants = [];

    if (eventId) {
      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ message: "Event not found" });

      participants = [
        ...event.participants.map(p => ({ avalancheId: p.avalancheId, name: p.name, email: p.email, department: p.department })),
        ...event.teams.flatMap(team => team.members.map(m => ({ avalancheId: m.avalancheId, name: m.name, email: m.email, department: m.department, teamName: team.teamName })))
      ];
    } else if (department) {
      const events = await Event.find({ department });
      events.forEach(event => {
        participants.push(
          ...event.participants.map(p => ({ avalancheId: p.avalancheId, name: p.name, email: p.email, event: event.name })),
          ...event.teams.flatMap(team => team.members.map(m => ({ avalancheId: m.avalancheId, name: m.name, email: m.email, event: event.name, teamName: team.teamName })))
        );
      });
    } else {
      return res.status(400).json({ message: "Provide eventId or department" });
    }

    const csv = [
      Object.keys(participants[0] || {}).join(","),
      ...participants.map(p => Object.values(p).join(","))
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename=participants.csv`);
    res.send(csv);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
