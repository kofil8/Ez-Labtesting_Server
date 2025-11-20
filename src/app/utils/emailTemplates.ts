export const shiftAssignedTemplate = (
  name: string,
  title: string,
  start: string,
  end: string
) => `
  <div style="font-family:Arial,sans-serif;line-height:1.6;">
    <h2>Hello ${name},</h2>
    <p>You have been assigned a new shift:</p>
    <ul>
      <li><b>Title:</b> ${title}</li>
      <li><b>Start:</b> ${start}</li>
      <li><b>End:</b> ${end}</li>
    </ul>
    <p>Login to view more details.</p>
  </div>
`;

export const teamInviteTemplate = (name: string, link: string) => `
  <div style="font-family:Arial,sans-serif;">
    <h2>Team Invitation</h2>
    <p>Hi ${name},</p>
    <p>You’ve been invited to join a team. Click below to accept:</p>
    <a href="${link}" style="background:#007bff;color:white;padding:10px 20px;border-radius:5px;text-decoration:none;">Accept Invite</a>
  </div>
`;
