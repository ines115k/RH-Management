from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from datetime import datetime
from .models import Attendance
from .serializers import AttendanceSerializer, CheckInSerializer, CheckOutSerializer
from authentication.backends import MongoJWTAuthentication

class CheckInView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = CheckInSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        existing = Attendance.objects(
            employee_id=str(request.user.id),
            date__gte=today_start
        ).first()
        
        if existing and existing.check_in:
            return Response(
                {'detail': 'Pointage entrée déjà effectué aujourdhui.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        attendance = Attendance(
            employee_id=str(request.user.id),
            check_in=datetime.utcnow(),
            status='present'
        )
        attendance.save()
        
        return Response({
            'detail': 'Pointage entrée enregistré',
            'check_in': attendance.check_in
        }, status=status.HTTP_201_CREATED)

class CheckOutView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = CheckOutSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        attendance = Attendance.objects(
            employee_id=str(request.user.id),
            date__gte=today_start
        ).first()
        
        if not attendance or not attendance.check_in:
            return Response(
                {'detail': 'Aucun pointage entrée trouvé pour aujourdhui.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if attendance.check_out:
            return Response(
                {'detail': 'Pointage sortie déjà effectué.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        attendance.check_out = datetime.utcnow()
        attendance.save()
        
        return Response({
            'detail': 'Pointage sortie enregistré',
            'check_out': attendance.check_out,
            'worked_hours': attendance.worked_hours
        })

class TodayAttendanceView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        attendance = Attendance.objects(
            employee_id=str(request.user.id),
            date__gte=today_start
        ).first()
        
        if attendance:
            return Response({
                'has_checked_in': bool(attendance.check_in),
                'has_checked_out': bool(attendance.check_out),
                'check_in': attendance.check_in,
                'check_out': attendance.check_out,
                'worked_hours': attendance.worked_hours
            })
        
        return Response({
            'has_checked_in': False,
            'has_checked_out': False
        })

class AttendanceHistoryView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        qs = Attendance.objects(employee_id=str(request.user.id)).order_by('-date').limit(30)
        return Response(AttendanceSerializer(qs, many=True).data)