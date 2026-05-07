from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from datetime import datetime
from .models import LeaveRequest
from .serializers import (
    LeaveRequestSerializer, CreateLeaveRequestSerializer, ReviewLeaveSerializer
)
from authentication.backends import MongoJWTAuthentication

class CreateLeaveRequestView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        serializer = CreateLeaveRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        existing = LeaveRequest.objects(
            employee_id=str(request.user.id),
            status__in=['pending', 'approved'],
            start_date__lte=serializer.validated_data['end_date'],
            end_date__gte=serializer.validated_data['start_date']
        ).first()
        
        if existing:
            return Response(
                {'detail': 'Vous avez déjà une demande de congé sur cette période.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        leave = LeaveRequest(
            employee_id=str(request.user.id),
            **serializer.validated_data
        )
        leave.save()
        
        return Response(
            LeaveRequestSerializer(leave).data,
            status=status.HTTP_201_CREATED
        )

class MyLeaveRequestsView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        leaves = LeaveRequest.objects(employee_id=str(request.user.id)).order_by('-created_at')
        return Response(LeaveRequestSerializer(leaves, many=True).data)

class AllLeaveRequestsView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        status_filter = request.query_params.get('status')
        employee_id = request.query_params.get('employee_id')
        
        qs = LeaveRequest.objects()
        
        if status_filter:
            qs = qs.filter(status=status_filter)
        if employee_id:
            qs = qs.filter(employee_id=employee_id)
        
        qs = qs.order_by('-created_at')
        return Response(LeaveRequestSerializer(qs, many=True).data)

class ReviewLeaveRequestView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def patch(self, request, pk):
        try:
            leave = LeaveRequest.objects.get(pk=pk)
        except:
            return Response(
                {'detail': 'Demande de congé introuvable.'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = ReviewLeaveSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        leave.status = serializer.validated_data['status']
        leave.reviewed_by = str(request.user.id)
        leave.reviewed_at = datetime.utcnow()
        leave.save()
        
        return Response(LeaveRequestSerializer(leave).data)

class LeaveStatsView(APIView):
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        pending = LeaveRequest.objects(status='pending').count()
        approved = LeaveRequest.objects(status='approved').count()
        rejected = LeaveRequest.objects(status='rejected').count()
        
        return Response({
            'pending': pending,
            'approved': approved,
            'rejected': rejected,
            'total': pending + approved + rejected
        })