const LeaveRequest = require('../models/LeaveRequest');
const Staff = require('../models/Staff');
const Student = require('../models/Student');
const { sendEmail } = require('../utils/emailService');

// @desc    Apply for a leave
// @route   POST /api/leaves/apply
// @access  Private (Student only)
const applyLeave = async (req, res, next) => {
  try {
    const { staffId, reason, fromDate, toDate } = req.body;

    if (!staffId || !reason || !fromDate || !toDate) {
      res.status(400);
      throw new Error('Please provide all required leave fields: staffId, reason, fromDate, toDate');
    }

    // Verify staff exists
    const staff = await Staff.findById(staffId);
    if (!staff) {
      res.status(404);
      throw new Error('Assigned staff member not found');
    }

    // Prepare Leave Request parameters
    const leaveData = {
      studentId: req.user._id,
      staffId,
      reason,
      fromDate,
      toDate,
      status: 'Pending'
    };

    // If an attachment file was uploaded via multer, save its properties
    if (req.file) {
      // Normalize path separating slashes for cross-platform URL compatibility
      leaveData.attachmentPath = req.file.path.replace(/\\/g, '/');
      leaveData.attachmentName = req.file.originalname;
    }

    const leaveRequest = await LeaveRequest.create(leaveData);

    // Format dates for email
    const formattedFrom = new Date(fromDate).toLocaleDateString();
    const formattedTo = new Date(toDate).toLocaleDateString();

    // Construct download URL for the reviewer
    const host = req.get('host');
    const protocol = req.protocol;
    const attachmentUrl = leaveRequest.attachmentPath
      ? `${protocol}://${host}/${leaveRequest.attachmentPath}`
      : '';

    // Compile email content for the Staff member
    const emailSubject = `New Leave Request from ${req.user.name}`;
    let emailText = `Dear ${staff.name},\n\n` +
      `Student ${req.user.name} (Roll No: ${req.user.rollNumber}) of ${req.user.department} department has applied for leave.\n\n` +
      `Leave Details:\n` +
      `- From: ${formattedFrom}\n` +
      `- To: ${formattedTo}\n` +
      `- Reason: ${reason}\n`;

    if (attachmentUrl) {
      emailText += `- Attachment Link: ${attachmentUrl}\n`;
    }

    emailText += `\nPlease log into the Leave Management System to approve or reject this request.\n\n` +
      `Best regards,\n` +
      `LMS Auto-Notifications`;

    let emailHtmlAttachmentRow = '';
    if (attachmentUrl) {
      emailHtmlAttachmentRow = `
        <tr>
          <td style="padding: 5px 0; font-weight: bold; vertical-align: top; width: 100px;">Attachment:</td>
          <td style="padding: 5px 0;">
            <a href="${attachmentUrl}" target="_blank" style="color: #4F46E5; font-weight: bold; text-decoration: underline;">
              ${leaveRequest.attachmentName}
            </a>
          </td>
        </tr>
      `;
    }

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4F46E5; border-bottom: 2px solid #F3F4F6; padding-bottom: 10px;">New Leave Application</h2>
        <p>Dear <strong>${staff.name}</strong>,</p>
        <p>Student <strong>${req.user.name}</strong> (Roll No: ${req.user.rollNumber}) from the <strong>${req.user.department}</strong> department has submitted a leave request that requires your review.</p>
        
        <div style="background-color: #F9FAFB; padding: 15px; border-left: 4px solid #4F46E5; margin: 20px 0; border-radius: 4px;">
          <h3 style="margin-top: 0; color: #1F2937;">Leave Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 5px 0; font-weight: bold; width: 100px;">From Date:</td>
              <td style="padding: 5px 0;">${formattedFrom}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-weight: bold;">To Date:</td>
              <td style="padding: 5px 0;">${formattedTo}</td>
            </tr>
            <tr>
              <td style="padding: 5px 0; font-weight: bold; vertical-align: top;">Reason:</td>
              <td style="padding: 5px 0; white-space: pre-wrap;">${reason}</td>
            </tr>
            ${emailHtmlAttachmentRow}
          </table>
        </div>
        
        <p>Please log into the portal to respond to this request.</p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
        <p style="font-size: 12px; color: #9CA3AF; text-align: center;">This is an automated notification. Please do not reply directly to this email.</p>
      </div>
    `;

    const emailParams = {
      to: staff.email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml
    };

    // If file exists, attach it directly to the email metadata
    if (req.file) {
      emailParams.attachments = [
        {
          filename: req.file.originalname,
          path: req.file.path
        }
      ];
    }

    // Send email to staff asynchronously (does not block user response)
    sendEmail(emailParams);

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully. Notification email sent to staff.',
      leaveRequest
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get leave history for logged in student
// @route   GET /api/leaves/student/history
// @access  Private (Student only)
const getStudentHistory = async (req, res, next) => {
  try {
    const history = await LeaveRequest.find({ studentId: req.user._id })
      .populate('staffId', 'name email department designation')
      .sort({ appliedDate: -1 });

    res.json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all pending leave requests for logged in staff
// @route   GET /api/leaves/staff/pending
// @access  Private (Staff only)
const getStaffPending = async (req, res, next) => {
  try {
    const pendingRequests = await LeaveRequest.find({
      staffId: req.user._id,
      status: 'Pending'
    })
      .populate('studentId', 'name email rollNumber department')
      .sort({ appliedDate: -1 });

    res.json({
      success: true,
      count: pendingRequests.length,
      requests: pendingRequests
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all resolved leave requests (Approved/Rejected) for logged in staff
// @route   GET /api/leaves/staff/history
// @access  Private (Staff only)
const getStaffHistory = async (req, res, next) => {
  try {
    const history = await LeaveRequest.find({
      staffId: req.user._id,
      status: { $ne: 'Pending' }
    })
      .populate('studentId', 'name email rollNumber department')
      .sort({ appliedDate: -1 });

    res.json({
      success: true,
      count: history.length,
      history
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or reject a leave request
// @route   PUT /api/leaves/respond/:id
// @access  Private (Staff only)
const respondLeaveRequest = async (req, res, next) => {
  try {
    const { status, responseMessage } = req.body;
    const leaveId = req.params.id;

    if (!status || !['Approved', 'Rejected'].includes(status)) {
      res.status(400);
      throw new Error('Please provide a valid response status: Approved or Rejected');
    }

    // Find the leave request and populate student details
    const leaveRequest = await LeaveRequest.findById(leaveId).populate('studentId');
    if (!leaveRequest) {
      res.status(404);
      throw new Error('Leave request not found');
    }

    // Verify this staff member is authorized to respond to this request
    if (leaveRequest.staffId.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to respond to this student leave request');
    }

    // Update fields
    leaveRequest.status = status;
    leaveRequest.responseMessage = responseMessage || '';
    await leaveRequest.save();

    // Fetch student info
    const student = leaveRequest.studentId;
    const formattedFrom = new Date(leaveRequest.fromDate).toLocaleDateString();
    const formattedTo = new Date(leaveRequest.toDate).toLocaleDateString();

    // Compile email content for the Student
    const emailSubject = `Leave Request Update: ${status}`;
    const emailText = `Dear ${student.name},\n\n` +
      `Your leave request from ${formattedFrom} to ${formattedTo} has been ${status.toUpperCase()} by staff member ${req.user.name}.\n\n` +
      `Staff Comments: ${responseMessage || 'No comments provided.'}\n\n` +
      `Please check your student dashboard for more details.\n\n` +
      `Best regards,\n` +
      `LMS Auto-Notifications`;

    const statusColor = status === 'Approved' ? '#10B981' : '#EF4444';

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #4F46E5; border-bottom: 2px solid #F3F4F6; padding-bottom: 10px;">Leave Request Update</h2>
        <p>Dear <strong>${student.name}</strong>,</p>
        <p>Your leave request has been reviewed and updated by staff member <strong>${req.user.name}</strong>.</p>
        
        <div style="background-color: #F9FAFB; padding: 15px; border-left: 4px solid ${statusColor}; margin: 20px 0; border-radius: 4px;">
          <h3 style="margin-top: 0; color: #1F2937;">Request Status</h3>
          <p style="font-size: 18px; font-weight: bold; color: ${statusColor}; margin: 5px 0;">
            ${status.toUpperCase()}
          </p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <tr>
              <td style="padding: 3px 0; font-weight: bold; width: 120px;">Duration:</td>
              <td style="padding: 3px 0;">${formattedFrom} to ${formattedTo}</td>
            </tr>
            <tr>
              <td style="padding: 3px 0; font-weight: bold; vertical-align: top;">Staff Message:</td>
              <td style="padding: 3px 0; font-style: italic;">"${responseMessage || 'None'}"</td>
            </tr>
          </table>
        </div>
        
        <p>You can check the full history on your Student Dashboard.</p>
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 20px 0;" />
        <p style="font-size: 12px; color: #9CA3AF; text-align: center;">This is an automated notification. Please do not reply directly to this email.</p>
      </div>
    `;

    // Send email to student asynchronously
    sendEmail({
      to: student.email,
      subject: emailSubject,
      text: emailText,
      html: emailHtml
    });

    res.json({
      success: true,
      message: `Leave request has been ${status.toLowerCase()} and notification sent.`,
      leaveRequest
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all staff members in the system (for Student leave apply dropdown)
// @route   GET /api/leaves/staff-list
// @access  Private
const getStaffList = async (req, res, next) => {
  try {
    const staffList = await Staff.find({}).select('name department designation email');
    res.json({
      success: true,
      count: staffList.length,
      staff: staffList
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyLeave,
  getStudentHistory,
  getStaffPending,
  getStaffHistory,
  respondLeaveRequest,
  getStaffList
};
