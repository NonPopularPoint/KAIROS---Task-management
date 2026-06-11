import re
import smtplib
import sys
import threading
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
from config import Config


def send_email(to_email: str, subject: str, html_body: str) -> bool:
    try:
        plain_text = re.sub(r'<[^>]+>', '', html_body)
        plain_text = re.sub(r'\n{3,}', '\n\n', plain_text).strip()

        msg = MIMEMultipart("alternative")
        msg["From"] = Config.SMTP_EMAIL
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(plain_text, "plain"))
        msg.attach(MIMEText(html_body, "html"))

        with smtplib.SMTP(Config.SMTP_SERVER, Config.SMTP_PORT, timeout=10) as server:
            server.starttls()
            server.login(Config.SMTP_EMAIL, Config.SMTP_PASSWORD)
            server.sendmail(Config.SMTP_EMAIL, to_email, msg.as_string())
        return True
    except Exception as e:
        print(f"SMTP send failed: {e}", file=sys.stderr)
        return False


def send_email_async(to_email: str, subject: str, html_body: str) -> None:
    thread = threading.Thread(target=send_email, args=(to_email, subject, html_body), daemon=True)
    thread.start()


def render_email(recipient_name: str, message: str, task_title: str,
                 task_status: str, task_priority: str, task_id: str = "",
                 note: Optional[str] = None) -> str:
    status_label = task_status.replace("_", " ").title()
    priority_label = task_priority.title()

    note_html = ""
    if note:
        note_html = f'''
        <div style="margin-top:20px;padding:14px 16px;background:#f8f7f4;border-left:3px solid #6366f1;border-radius:8px;font-size:14px;line-height:1.6;color:#374151">
          <p style="margin:0 0 6px;font-weight:600;font-size:13px;color:#6366f1;text-transform:uppercase;letter-spacing:0.3px">Note</p>
          {note}
        </div>'''

    link_html = ""
    if task_id:
        frontend_url = Config.FRONTEND_ORIGIN if hasattr(Config, 'FRONTEND_ORIGIN') else "http://localhost:3000"
        link_html = f'''
        <div style="text-align:center;margin-top:28px">
          <a href="{frontend_url}/tasks/{task_id}" style="display:inline-block;padding:12px 32px;background:#6366f1;color:#fff;text-decoration:none;border-radius:10px;font-size:15px;font-weight:600;letter-spacing:0.2px">View Task</a>
        </div>'''

    priority_colors = {"low": "#6b7280", "medium": "#d97706", "high": "#dc2626", "critical": "#dc2626"}
    priority_bg = {"low": "#f3f4f6", "medium": "#fef3c7", "high": "#fee2e2", "critical": "#fecaca"}
    status_colors = {"pending": "#6b7280", "in_progress": "#4f46e5", "ready_for_review": "#d97706", "completed": "#059669", "cancelled": "#dc2626"}
    status_bg = {"pending": "#f3f4f6", "in_progress": "#eef2ff", "ready_for_review": "#fef3c7", "completed": "#d1fae5", "cancelled": "#fee2e2"}

    p_color = priority_colors.get(task_priority, "#6b7280")
    p_bg = priority_bg.get(task_priority, "#f3f4f6")
    s_color = status_colors.get(task_status, "#6b7280")
    s_bg = status_bg.get(task_status, "#f3f4f6")

    return f'''<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f0eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:24px 0">
    <tr><td align="center">
      <table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06)">
        <tr>
          <td style="background:#6366f1;padding:28px 32px;text-align:center">
            <h1 style="color:#ffffff;margin:0;font-size:22px;font-weight:700;letter-spacing:0.5px">KAIROS</h1>
            <p style="color:rgba(255,255,255,0.7);margin:4px 0 0;font-size:13px">Task Management</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px 24px">
            <p style="font-size:16px;margin:0 0 6px;color:#374151">Hi <strong>{recipient_name}</strong>,</p>
            <p style="font-size:16px;margin:0 0 24px;color:#6b7280;line-height:1.6">{message}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f9f8f6;border-radius:10px;padding:16px 20px;margin-bottom:4px">
              <tr>
                <td style="padding:6px 0;font-size:13px;color:#6b7280;width:80px">Task</td>
                <td style="padding:6px 0;font-size:14px;color:#111827;font-weight:600">{task_title}</td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:13px;color:#6b7280">Status</td>
                <td style="padding:6px 0">
                  <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:13px;font-weight:500;background:{s_bg};color:{s_color}">{status_label}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:6px 0;font-size:13px;color:#6b7280">Priority</td>
                <td style="padding:6px 0">
                  <span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:13px;font-weight:500;background:{p_bg};color:{p_color}">{priority_label}</span>
                </td>
              </tr>
            </table>
            {note_html}
            {link_html}
          </td>
        </tr>
        <tr>
          <td style="padding:20px 32px;border-top:1px solid #f3f0eb;text-align:center">
            <p style="margin:0;font-size:12px;color:#a6a09a">KAIROS — Focus on what matters now.</p>
            <p style="margin:4px 0 0;font-size:12px;color:#a6a09a">Sent from your team workspace.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>'''


TASK_ASSIGNED_SUBJECT = "KAIROS | Task Assigned: {task_title}"
TASK_ASSIGNED_MESSAGE = "{creator_name} has assigned you a task."

TASK_REASSIGNED_SUBJECT = "KAIROS | Task Reassigned: {task_title}"
TASK_REASSIGNED_MESSAGE = "{creator_name} has reassigned this task to you."

TASK_REASSIGNED_PREV_SUBJECT = "KAIROS | Task Reassigned: {task_title}"
TASK_REASSIGNED_PREV_MESSAGE = "You have been removed from this task. Reason: {reason}"

TASK_UNASSIGNED_SUBJECT = "KAIROS | Task Unassigned: {task_title}"
TASK_UNASSIGNED_MESSAGE = "You have been removed as the assignee from this task."

TASK_CLAIMED_SUBJECT = "KAIROS | Task Claimed: {task_title}"
TASK_CLAIMED_MESSAGE = "{claimant_name} has claimed your task."

TASK_READY_FOR_REVIEW_SUBJECT = "KAIROS | Ready For Review: {task_title}"
TASK_READY_FOR_REVIEW_MESSAGE = "{assignee_name} has submitted this task for your review."

TASK_APPROVED_SUBJECT = "KAIROS | Task Approved: {task_title}"
TASK_APPROVED_MESSAGE = "Your task has been approved and marked as complete."

TASK_CHANGES_REQUESTED_SUBJECT = "KAIROS | Changes Requested: {task_title}"
TASK_CHANGES_REQUESTED_MESSAGE = "{creator_name} has requested changes on your task."

TASK_CANCELLED_SUBJECT = "KAIROS | Task Cancelled: {task_title}"
TASK_CANCELLED_MESSAGE = "{creator_name} has cancelled this task."

TASK_REOPENED_SUBJECT = "KAIROS | Task Reopened: {task_title}"
TASK_REOPENED_MESSAGE = "{creator_name} has reopened this task."
