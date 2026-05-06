import os
from datetime import datetime
from bson import ObjectId
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser

from .models import JobOffer, Application
from .serializers import JobOfferSerializer, JobOfferCreateSerializer, ApplicationSerializer, ApplicationUpdateSerializer
from employees.models import Employee

# ---------- Offres d'emploi ----------
class JobOfferListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        qs = JobOffer.objects.all()
        if request.user.role == 'employee':
            qs = qs.filter(status='published')
        else:
            if request.query_params.get('status'): qs = qs.filter(status=request.query_params['status'])
            if request.query_params.get('department'): qs = qs.filter(department=request.query_params['department'])
        records = list(qs)
        return Response({'total': len(records), 'records': JobOfferSerializer(records, many=True).data})
    def post(self, request):
        if request.user.role not in ('admin','manager'): return Response({'detail':'Permission refusée.'}, status=403)
        ser = JobOfferCreateSerializer(data=request.data)
        if not ser.is_valid(): return Response(ser.errors, status=400)
        offer = JobOffer(**ser.validated_data, created_by=str(request.user.pk))
        if ser.validated_data.get('status') == 'published':
            offer.published_date = datetime.utcnow()
        offer.save()
        return Response(JobOfferSerializer(offer).data, status=201)

class JobOfferDetailView(APIView):
    permission_classes = [IsAuthenticated]
    def get_object(self, pk):
        try: return JobOffer.objects.get(pk=ObjectId(pk))
        except: return None
    def get(self, request, pk):
        offer = self.get_object(pk)
        if not offer: return Response({'detail':'Introuvable'},404)
        if request.user.role == 'employee' and offer.status != 'published': return Response({'detail':'Accès refusé'},403)
        return Response(JobOfferSerializer(offer).data)
    def patch(self, request, pk):
        if request.user.role not in ('admin','manager'): return Response({'detail':'Permission refusée'},403)
        offer = self.get_object(pk)
        if not offer: return Response({'detail':'Introuvable'},404)
        for field in ('title','department','contract_type','location','description','requirements','closing_date','status'):
            if field in request.data:
                setattr(offer, field, request.data[field])
        if request.data.get('status') == 'published' and offer.published_date is None:
            offer.published_date = datetime.utcnow()
        offer.save()
        return Response(JobOfferSerializer(offer).data)
    def delete(self, request, pk):
        if request.user.role != 'admin': return Response({'detail':'Réservé admin'},403)
        offer = self.get_object(pk)
        if not offer: return Response({'detail':'Introuvable'},404)
        offer.delete()
        return Response({'detail':'Offre supprimée'})

# ---------- Candidatures ----------
class ApplicationListView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        qs = Application.objects.all()
        if request.user.role == 'employee':
            try:
                emp = Employee.objects.get(user_id=str(request.user.pk))
                qs = qs.filter(employee_id=str(emp.pk))
            except: return Response({'total':0,'records':[]})
        else:
            if request.query_params.get('job_offer_id'): qs = qs.filter(job_offer_id=request.query_params['job_offer_id'])
            if request.query_params.get('status'): qs = qs.filter(status=request.query_params['status'])
        records = list(qs)
        return Response({'total': len(records), 'records': ApplicationSerializer(records, many=True).data})
    def post(self, request):
        if request.user.role != 'employee': return Response({'detail':'Seuls les employés peuvent postuler'},403)
        emp = Employee.objects.get(user_id=str(request.user.pk))
        job_offer_id = request.data.get('job_offer_id')
        if not job_offer_id: return Response({'detail':'job_offer_id requis'},400)
        offer = JobOffer.objects.filter(pk=ObjectId(job_offer_id), status='published').first()
        if not offer: return Response({'detail':'Offre non disponible'},400)
        if Application.objects(job_offer_id=job_offer_id, employee_id=str(emp.pk)).first():
            return Response({'detail':'Vous avez déjà postulé'},400)
        app = Application(job_offer_id=job_offer_id, employee_id=str(emp.pk), employee_name=emp.full_name,
                          cover_letter=request.data.get('cover_letter',''), status='pending')
        app.save()
        return Response(ApplicationSerializer(app).data, status=201)

class ApplicationDetailView(APIView):
    permission_classes = [IsAuthenticated]
    def get_object(self, pk):
        try: return Application.objects.get(pk=ObjectId(pk))
        except: return None
    def get(self, request, pk):
        app = self.get_object(pk)
        if not app: return Response({'detail':'Introuvable'},404)
        if request.user.role == 'employee':
            emp = Employee.objects.get(user_id=str(request.user.pk))
            if app.employee_id != str(emp.pk): return Response({'detail':'Accès refusé'},403)
        return Response(ApplicationSerializer(app).data)
    def patch(self, request, pk):
        if request.user.role not in ('admin','manager'): return Response({'detail':'Permission refusée'},403)
        app = self.get_object(pk)
        if not app: return Response({'detail':'Introuvable'},404)
        ser = ApplicationUpdateSerializer(data=request.data)
        if not ser.is_valid(): return Response(ser.errors, status=400)
        app.status = ser.validated_data['status']
        app.feedback = ser.validated_data.get('feedback','')
        app.reviewed_by = str(request.user.pk)
        app.reviewed_at = datetime.utcnow()
        app.save()
        return Response(ApplicationSerializer(app).data)
    def delete(self, request, pk):
        if request.user.role != 'admin': return Response({'detail':'Réservé admin'},403)
        app = self.get_object(pk)
        if not app: return Response({'detail':'Introuvable'},404)
        app.delete()
        return Response({'detail':'Candidature supprimée'})

# ---------- Upload CV ----------
class CVUploadView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    def post(self, request, app_id):
        app = Application.objects.get(pk=ObjectId(app_id))
        if not app: return Response({'detail':'Introuvable'},404)
        emp = Employee.objects.get(user_id=str(request.user.pk))
        if app.employee_id != str(emp.pk): return Response({'detail':'Accès refusé'},403)
        cv = request.FILES.get('cv')
        if not cv: return Response({'detail':'Fichier manquant'},400)
        upload_dir = os.path.join(settings.MEDIA_ROOT, 'recruitment', 'cvs')
        os.makedirs(upload_dir, exist_ok=True)
        filename = f"{app_id}_{cv.name}"
        with open(os.path.join(upload_dir, filename), 'wb+') as f:
            for chunk in cv.chunks(): f.write(chunk)
        app.cv_url = f"/media/recruitment/cvs/{filename}"
        app.save()
        return Response({'cv_url': app.cv_url})