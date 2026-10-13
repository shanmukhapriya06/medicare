/**
 * Appointment confirmation PDF generator (zero-dependency).
 *
 * Builds a real, printable PDF 1.4 document straight from the appointment
 * data returned by the MediCare backend - no fake or placeholder details.
 * The MediCare logo is drawn as vector shapes so the document stays crisp
 * when printed.
 */

const TEAL = '0.055 0.455 0.565';
const TEAL_LIGHT = '0.031 0.569 0.698';
const INK = '0.059 0.09 0.165';
const MUTED = '0.392 0.455 0.545';
const BORDER = '0.886 0.91 0.941';
const PANEL = '0.973 0.98 0.988';
const WHITE = '1 1 1';
const GREEN = '0.086 0.639 0.29';
const AMBER = '0.851 0.467 0.024';
const RED = '0.863 0.149 0.149';

const STATUS_COLORS = {
  CONFIRMED: GREEN,
  APPROVED: GREEN,
  COMPLETED: GREEN,
  PENDING: AMBER,
  REJECTED: RED,
  CANCELLED: RED,
};

function n(value) {
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '.0');
}

/** Replaces characters that WinAnsi Helvetica cannot render. */
function sanitize(value) {
  return String(value ?? '')
    .replace(/₹/g, 'Rs. ')
    .replace(/[•·]/g, '-')
    .replace(/[–—]/g, '-')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/…/g, '...')
    .replace(/ø/g, 'o')
    .replace(/[^\x20-\x7E]/g, '');
}

/** Escapes a string for use inside a PDF literal string. */
function escapePdfText(value) {
  return sanitize(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

/** Rough advance-width estimate used for wrapping (Helvetica ~0.52 em avg). */
function textWidth(text, size) {
  return sanitize(text).length * size * 0.52;
}

function wrapText(value, size, maxWidth, maxLines = 3) {
  const words = sanitize(value).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];
  const lines = [];
  let current = '';
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (textWidth(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
      if (lines.length === maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines) {
    const last = lines[maxLines - 1];
    if (textWidth(last, size) > maxWidth || words.length > lines.join(' ').split(/\s+/).length) {
      lines[maxLines - 1] = `${last.replace(/\s+$/, '')}...`.slice(0, Math.max(8, Math.floor(maxWidth / (size * 0.52))));
    }
  }
  return lines;
}

function formatDate(value) {
  if (!value) return 'Not specified';
  const str = String(value);
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return str;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  if (Number.isNaN(date.getTime())) return str;
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatTime(value) {
  if (!value) return 'Not specified';
  return String(value).substring(0, 5);
}

function formatFee(value) {
  if (value === null || value === undefined || value === '') return null;
  const amount = Number(value);
  if (Number.isNaN(amount)) return null;
  return `Rs. ${amount.toLocaleString('en-IN')}`;
}

function buildContentStream(appt) {
  const ops = [];

  const fillRect = (x, y, w, h, color) => {
    ops.push(`${color} rg\n${n(x)} ${n(y)} ${n(w)} ${n(h)} re f`);
  };
  const strokeRect = (x, y, w, h, color, lineWidth = 1) => {
    ops.push(`${color} RG\n${n(lineWidth)} w\n${n(x)} ${n(y)} ${n(w)} ${n(h)} re S`);
  };
  const line = (x1, y1, x2, y2, color, lineWidth = 1) => {
    ops.push(`${color} RG\n${n(lineWidth)} w\n${n(x1)} ${n(y1)} m ${n(x2)} ${n(y2)} l S`);
  };
  const text = (x, y, value, { font = 'F1', size = 11, color = INK } = {}) => {
    ops.push(
      `BT /${font} ${n(size)} Tf ${color} rg 1 0 0 1 ${n(x)} ${n(y)} Tm (${escapePdfText(value)}) Tj ET`
    );
  };
  // MediCare logo: rounded medical cross drawn in white on the teal band
  const logoCross = (cx, cy, arm, thickness, color) => {
    ops.push(`${color} rg`);
    ops.push(`${n(cx - thickness / 2)} ${n(cy - arm)} ${n(thickness)} ${n(arm * 2)} re f`);
    ops.push(`${n(cx - arm)} ${n(cy - thickness / 2)} ${n(arm * 2)} ${n(thickness)} re f`);
  };

  const pageWidth = 595;
  const marginX = 48;

  // ---------------- Header band with logo ----------------
  fillRect(0, 762, pageWidth, 80, TEAL);
  logoCross(62, 802, 13, 6, WHITE);
  text(84, 798, 'MediCare', { font: 'F2', size: 21, color: WHITE });
  text(84, 783, 'Smart Healthcare Appointment & Patient Support System', {
    size: 8.5,
    color: '0.85 0.94 0.97',
  });

  const rightX = 547;
  const confirmation = 'Appointment Confirmation';
  text(rightX - textWidth(confirmation, 13), 800, confirmation, { font: 'F2', size: 13, color: WHITE });
  const generated = `Generated: ${formatDate(new Date())}`;
  text(rightX - textWidth(generated, 8.5), 784, generated, {
    size: 8.5,
    color: '0.85 0.94 0.97',
  });

  // ---------------- Title ----------------
  text(marginX, 722, 'Your appointment has been booked', { font: 'F2', size: 18, color: INK });
  text(marginX, 702, 'Please keep this confirmation for your records and present it at the clinic.', {
    size: 10.5,
    color: MUTED,
  });

  // ---------------- Details panel ----------------
  const rows = [
    ['Appointment ID', `#${appt.id}`, true],
    ['Booking Status', sanitize(appt.status || 'PENDING'), false],
    ['Patient Name', appt.patientName || 'Not specified', true],
    ['Doctor Name', appt.doctorName || 'Not specified', true],
    ['Specialization', appt.doctorSpecialization || appt.specialization || 'General', true],
    ['Appointment Date', formatDate(appt.appointmentDate), true],
    ['Appointment Time', formatTime(appt.appointmentTime), true],
  ];
  const fee = formatFee(appt.consultationFee);
  if (fee) rows.push(['Consultation Fee', fee, true]);
  if (appt.reason && String(appt.reason).trim()) rows.push(['Reason for Visit', String(appt.reason).trim(), false]);

  const panelX = marginX;
  const panelWidth = pageWidth - marginX * 2;
  const labelX = panelX + 28;
  const valueX = panelX + 170;
  const rowHeight = 24;
  const panelTop = 684;
  const fixedRowsHeight = rows.length * rowHeight;
  const addressLines = appt.clinicAddress && String(appt.clinicAddress).trim()
    ? wrapText(appt.clinicAddress, 10.5, panelWidth - (valueX - panelX) - 24, 3)
    : [];
  const addressExtra = addressLines.length > 0 ? 18 + addressLines.length * 14 : 0;
  const panelHeight = fixedRowsHeight + addressExtra + 26;
  const panelBottom = panelTop - panelHeight;

  fillRect(panelX, panelBottom, panelWidth, panelHeight, PANEL);
  fillRect(panelX, panelBottom, 4, panelHeight, TEAL_LIGHT);
  strokeRect(panelX, panelBottom, panelWidth, panelHeight, BORDER, 1);

  text(labelX, panelTop - 20, 'APPOINTMENT DETAILS', { font: 'F2', size: 9.5, color: TEAL });

  let y = panelTop - 44;
  for (const [label, value, boldValue] of rows) {
    text(labelX, y, label, { font: 'F2', size: 10, color: MUTED });
    if (label === 'Booking Status') {
      const statusColor = STATUS_COLORS[String(appt.status || '').toUpperCase()] || TEAL;
      text(valueX, y, String(value).toUpperCase(), { font: 'F2', size: 10.5, color: statusColor });
    } else {
      const maxChars = Math.floor((panelWidth - (valueX - panelX) - 24) / 5.5);
      const clipped = sanitize(value).length > maxChars
        ? `${sanitize(value).slice(0, maxChars - 3)}...`
        : sanitize(value);
      text(valueX, y, clipped, { font: boldValue ? 'F2' : 'F1', size: 10.5, color: INK });
    }
    y -= rowHeight;
  }

  if (addressLines.length > 0) {
    text(labelX, y, 'Clinic Address', { font: 'F2', size: 10, color: MUTED });
    y -= 14;
    for (const addressLine of addressLines) {
      text(valueX, y, addressLine, { size: 10.5, color: INK });
      y -= 14;
    }
  }

  // ---------------- Instructions ----------------
  let cursor = panelBottom - 34;
  text(marginX, cursor, 'Before your visit', { font: 'F2', size: 12, color: INK });
  cursor -= 18;
  const instructions = [
    'Please arrive 10 minutes before your scheduled appointment time.',
    'Carry a valid government-issued photo ID for check-in verification.',
    'Contact the clinic if you need to reschedule or cancel your visit.',
  ];
  for (const instruction of instructions) {
    fillRect(marginX + 2, cursor + 3, 4, 4, TEAL_LIGHT);
    text(marginX + 14, cursor, instruction, { size: 10, color: MUTED });
    cursor -= 16;
  }

  // ---------------- Footer ----------------
  line(marginX, 84, pageWidth - marginX, 84, BORDER, 1);
  text(marginX, 68, 'MediCare - Smart Healthcare Appointment & Patient Support System', {
    size: 8.5,
    color: MUTED,
  });
  const footerRight = 'System-generated document - valid without signature';
  text(pageWidth - marginX - textWidth(footerRight, 8.5), 68, footerRight, {
    size: 8.5,
    color: MUTED,
  });
  text(marginX, 54, '(c) 2026 MediCare. Built with React + Spring Boot + MySQL.', {
    size: 8,
    color: '0.55 0.6 0.67',
  });

  return `${ops.join('\n')}\n`;
}

/**
 * Builds the raw PDF file bytes for one appointment.
 * @param {Object} appt - appointment payload from the backend
 * @returns {Uint8Array}
 */
export function buildAppointmentPdfBytes(appt) {
  const content = buildContentStream(appt);

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] '
      + '/Resources << /Font << /F1 5 0 R /F2 6 0 R >> >> /Contents 4 0 R >>',
    `<< /Length ${content.length} >>\nstream\n${content}endstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>',
  ];

  let offset = 0;
  const chunks = [];
  const offsets = [];
  const push = (str) => {
    chunks.push(str);
    offset += str.length;
  };

  push('%PDF-1.4\n%\xE2\xE3\xCF\xD3\n');
  objects.forEach((body, index) => {
    offsets[index] = offset;
    push(`${index + 1} 0 obj\n${body}\nendobj\n`);
  });

  const xrefStart = offset;
  push(`xref\n0 ${objects.length + 1}\n`);
  push('0000000000 65535 f \n');
  offsets.forEach((value) => {
    push(`${String(value).padStart(10, '0')} 00000 n \n`);
  });
  push(`trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`);

  const raw = chunks.join('');
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i += 1) {
    bytes[i] = raw.charCodeAt(i) & 0xff;
  }
  return bytes;
}

/**
 * True when the appointment carries enough real data to build a PDF.
 * @param {Object} appt
 * @returns {boolean}
 */
export function hasValidAppointmentDetails(appt) {
  return Boolean(
    appt
    && appt.id !== null
    && appt.id !== undefined
    && String(appt.doctorName || '').trim()
    && String(appt.appointmentDate || '').trim()
    && String(appt.status || '').trim()
  );
}

/**
 * Generates and downloads the appointment confirmation PDF.
 * @param {Object} appt
 * @returns {boolean} true when the download was triggered
 */
export function downloadAppointmentPdf(appt) {
  if (!hasValidAppointmentDetails(appt)) return false;

  const bytes = buildAppointmentPdfBytes(appt);
  const blob = new Blob([bytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `MediCare-Appointment-${appt.id}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
  return true;
}

/**
 * Statuses for which the download option is offered to patients.
 * @param {Object} appt
 * @returns {boolean}
 */
export function isDownloadableAppointment(appt) {
  if (!hasValidAppointmentDetails(appt)) return false;
  const status = String(appt.status || '').toUpperCase();
  return ['CONFIRMED', 'APPROVED', 'COMPLETED', 'PENDING'].includes(status);
}
