import * as XLSX from 'xlsx';

interface ExportData {
  [key: string]: string | number | boolean | Date | null | undefined;
}

export function exportToExcel(data: ExportData[], filename: string, sheetName: string = 'Sheet1') {
  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Auto-size columns
  const colWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.max(
      key.length,
      ...data.map(row => String(row[key] || '').length)
    ) + 2
  }));
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Generate buffer and save
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

// Export functions for different data types
export function exportPatientsToExcel(patients: any[]) {
  const data = patients.map(p => ({
    'الاسم': p.name_ar || p.name,
    'العمر': p.age,
    'الجنس': p.gender === 'male' ? 'ذكر' : 'أنثى',
    'الهاتف': p.phone || '-',
    'فصيلة الدم': p.blood_type || '-',
    'الأمراض المزمنة': (p.chronic_conditions || []).join(', ') || '-',
    'الحساسية': (p.allergies || []).join(', ') || '-',
  }));
  exportToExcel(data, `patients_${new Date().toISOString().split('T')[0]}`, 'المرضى');
}

export function exportAppointmentsToExcel(appointments: any[]) {
  const statusLabels: Record<string, string> = {
    'booked': 'محجوز',
    'arrived': 'وصل',
    'in-consultation': 'في الكشف',
    'completed': 'مكتمل',
    'no-show': 'لم يحضر'
  };

  const data = appointments.map(a => ({
    'اسم المريض': a.patient_name,
    'وقت الموعد': new Date(a.scheduled_time).toLocaleString('ar-EG'),
    'الحالة': statusLabels[a.status] || a.status,
    'مسار سريع': a.is_fast_track ? 'نعم' : 'لا',
    'وقت الوصول': a.arrival_time ? new Date(a.arrival_time).toLocaleTimeString('ar-EG') : '-',
  }));
  exportToExcel(data, `appointments_${new Date().toISOString().split('T')[0]}`, 'المواعيد');
}

export function exportFinancesToExcel(entries: any[]) {
  const serviceLabels: Record<string, string> = {
    'consultation': 'استشارة',
    'checkup': 'كشف',
    'follow-up': 'متابعة',
  };

  const paymentLabels: Record<string, string> = {
    'cash': 'نقدي',
    'instapay': 'InstaPay',
    'card': 'بطاقة',
  };

  const data = entries.map(e => ({
    'الوقت': e.time,
    'اسم المريض': e.patientName,
    'نوع الخدمة': serviceLabels[e.serviceType] || e.serviceType,
    'السعر': e.price,
    'طريقة الدفع': paymentLabels[e.paymentMethod] || e.paymentMethod,
    'الحالة': e.status === 'paid' ? 'مدفوع' : 'معلق',
  }));
  exportToExcel(data, `finances_${new Date().toISOString().split('T')[0]}`, 'المالية');
}

export function exportVisitsToExcel(visits: any[]) {
  const data = visits.map(v => ({
    'تاريخ الزيارة': new Date(v.visit_date).toLocaleString('ar-EG'),
    'الشكوى الرئيسية': v.chief_complaint || '-',
    'التشخيص': v.diagnosis || '-',
    'الوزن': v.weight ? `${v.weight} كجم` : '-',
    'ضغط الدم': v.bp_systolic && v.bp_diastolic ? `${v.bp_systolic}/${v.bp_diastolic}` : '-',
    'الحرارة': v.temperature ? `${v.temperature}°` : '-',
    'معدل النبض': v.heart_rate ? `${v.heart_rate} bpm` : '-',
    'الملاحظات': v.notes || '-',
  }));
  exportToExcel(data, `visits_${new Date().toISOString().split('T')[0]}`, 'الزيارات');
}
