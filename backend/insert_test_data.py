import datetime
import random
from employees.models import Employee
from attendance.models import Attendance, LeaveRequest

# 1. Récupérer des employés existants
employees = list(Employee.objects.all())
if not employees:
    print("Aucun employé trouvé. Créez des employés d'abord.")
    exit()

test_employees = employees[:3]
print(f"Employés utilisés : {[e.full_name for e in test_employees]}")

# 2. Dates de test (mois en cours + mois précédent)
today = datetime.date.today()
current_month_start = today.replace(day=1)
last_month_end = current_month_start - datetime.timedelta(days=1)
last_month_start = last_month_end.replace(day=1)

start_date = last_month_start
end_date = today

# 3. Générer des pointages
def random_time(hour_min, hour_max):
    now = datetime.datetime.now()
    return now.replace(
        hour=random.randint(hour_min, hour_max),
        minute=random.choice([0, 15, 30, 45]),
        second=0, microsecond=0
    )

current_date = start_date
while current_date <= end_date:
    # Sauter les weekends (samedi=5, dimanche=6)
    if current_date.weekday() >= 5:
        current_date += datetime.timedelta(days=1)
        continue

    for emp in test_employees:
        existing = Attendance.objects(employee_id=str(emp.id), date=current_date).first()
        if existing:
            continue

        rand = random.random()
        if rand < 0.6:
            status = 'present'
            check_in = random_time(8, 9)
            check_out = random_time(16, 18)
        elif rand < 0.75:
            status = 'late'
            check_in = random_time(9, 11)
            check_out = random_time(16, 18)
        elif rand < 0.9:
            status = 'half_day'
            check_in = random_time(8, 10)
            check_out = random_time(12, 13)
        else:
            status = 'absent'
            check_in = None
            check_out = None

        att = Attendance(
            employee_id=str(emp.id),
            employee_name=emp.full_name,
            date=current_date,
            check_in=check_in,
            check_out=check_out,
            status=status,
            note="Donnée de test"
        )
        att.save()
        print(f"Attendance créé : {emp.full_name} - {current_date} - {status}")

    current_date += datetime.timedelta(days=1)

# 4. Générer des demandes de congé
leave_types = ['annual', 'sick', 'exceptional', 'unpaid', 'maternity', 'other']
statuses = ['pending', 'approved', 'rejected', 'cancelled']

for emp in test_employees:
    for _ in range(random.randint(2, 4)):
        start = start_date + datetime.timedelta(days=random.randint(0, 60))
        duration = random.randint(1, 5)
        end = start + datetime.timedelta(days=duration)

        leave_type = random.choice(leave_types)
        status = random.choices(
            statuses,
            weights=[0.4, 0.4, 0.15, 0.05],
            k=1
        )[0]

        reason = f"Demande de test pour {leave_type}"

        existing = LeaveRequest.objects(
            employee_id=str(emp.id),
            start_date__lte=end,
            end_date__gte=start,
            status__in=['pending', 'approved']
        ).first()
        if existing:
            continue

        leave = LeaveRequest(
            employee_id=str(emp.id),
            employee_name=emp.full_name,
            leave_type=leave_type,
            start_date=start,
            end_date=end,
            reason=reason,
            status=status,
            rejection_reason="Motif de rejet exemple" if status == 'rejected' else ""
        )
        if status == 'approved':
            leave.approved_by = str(emp.id)  # ou un admin fictif
            leave.approved_at = datetime.datetime.utcnow()
        leave.save()
        print(f"LeaveRequest créé : {emp.full_name} - {leave_type} ({start} -> {end}) - {status}")

print("Insertion des données de test terminée.")