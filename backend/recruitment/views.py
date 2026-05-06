import os
from datetime import datetime
from bson import ObjectId
from django.conf import settings
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser

from .models import JobOffer, JobApplication
from .serializers import (
    JobOfferSerializer, JobOfferCreateSerializer,
    JobApplicationSerializer, JobApplicationCreateSerializer,
    JobApplicationReviewSerializer
)
from .permissions import IsAdminOrHRManager
from authentication.backends import MongoJWTAuthentication


# ==================== OFFRES D'EMPLOI ====================

class JobOfferListView(APIView):
    """Liste des offres d'emploi (public)"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        qs = JobOffer.objects(is_active=True)
        
        # Filtres
        department = request.query_params.get('department')
        if department:
            qs = qs.filter(department=department)
        
        contract_type = request.query_params.get('contract_type')
        if contract_type:
            qs = qs.filter(contract_type=contract_type)
        
        # Pagination
        limit = int(request.query_params.get('limit', 50))
        offers = list(qs.order_by('-posted_date').limit(limit))
        
        return Response({
            'total': len(offers),
            'offers': JobOfferSerializer(offers, many=True).data
        })


class JobOfferDetailView(APIView):
    """Détail d'une offre"""
    permission_classes = [AllowAny]
    
    def get(self, request, pk):
        try:
            offer = JobOffer.objects.get(pk=ObjectId(pk), is_active=True)
            return Response(JobOfferSerializer(offer).data)
        except:
            return Response(
                {'detail': 'Offre non trouvée'},
                status=status.HTTP_404_NOT_FOUND
            )


class JobOfferManageView(APIView):
    """Gestion des offres (admin/manager)"""
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminOrHRManager]
    
    def get(self, request):
        """Liste toutes les offres (y compris inactives)"""
        qs = JobOffer.objects.all()
        
        status_filter = request.query_params.get('status')
        if status_filter == 'active':
            qs = qs.filter(is_active=True)
        elif status_filter == 'inactive':
            qs = qs.filter(is_active=False)
        
        offers = list(qs.order_by('-posted_date'))
        return Response(JobOfferSerializer(offers, many=True).data)
    
    def post(self, request):
        """Créer une offre"""
        serializer = JobOfferCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        offer = JobOffer(
            **serializer.validated_data,
            created_by=str(request.user.id)
        )
        offer.save()
        
        return Response(
            JobOfferSerializer(offer).data,
            status=status.HTTP_201_CREATED
        )
    
    def patch(self, request, pk):
        """Modifier une offre"""
        try:
            offer = JobOffer.objects.get(pk=ObjectId(pk))
        except:
            return Response(
                {'detail': 'Offre non trouvée'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        for field, value in request.data.items():
            if field in ('title', 'department', 'contract_type', 'location', 
                        'description', 'requirements', 'experience', 'education', 'deadline'):
                setattr(offer, field, value)
        
        offer.save()
        return Response(JobOfferSerializer(offer).data)
    
    def delete(self, request, pk):
        """Supprimer une offre"""
        try:
            offer = JobOffer.objects.get(pk=ObjectId(pk))
            offer.delete()
            return Response({'detail': 'Offre supprimée'})
        except:
            return Response(
                {'detail': 'Offre non trouvée'},
                status=status.HTTP_404_NOT_FOUND
            )


# ==================== CANDIDATURES ====================

class JobApplicationCreateView(APIView):
    """Soumettre une candidature"""
    parser_classes = [MultiPartParser, FormParser]
    permission_classes = [AllowAny]
    
    def post(self, request):
        # Extraire les données du formulaire
        data = {
            'offer_id': request.data.get('offer_id'),
            'first_name': request.data.get('first_name'),
            'last_name': request.data.get('last_name'),
            'email': request.data.get('email'),
            'phone': request.data.get('phone', ''),
            'current_position': request.data.get('current_position', ''),
            'experience_years': request.data.get('experience_years', 0),
            'cover_letter': request.data.get('cover_letter', ''),
            'portfolio_url': request.data.get('portfolio_url', ''),
            'linkedin_url': request.data.get('linkedin_url', ''),
        }
        
        serializer = JobApplicationCreateSerializer(data=data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        # Récupérer l'offre
        try:
            offer = JobOffer.objects.get(pk=ObjectId(serializer.validated_data['offer_id']))
        except:
            return Response(
                {'detail': 'Offre non trouvée'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Sauvegarder le CV
        cv_file = request.FILES.get('cv')
        cv_url = ''
        if cv_file:
            # Vérifier le type de fichier
            allowed_types = ['application/pdf', 'application/msword', 
                           'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
            if cv_file.content_type not in allowed_types:
                return Response(
                    {'detail': 'Format de fichier non supporté. Utilisez PDF ou DOC.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Sauvegarder le fichier
            upload_dir = os.path.join(settings.MEDIA_ROOT, 'cvs')
            os.makedirs(upload_dir, exist_ok=True)
            
            filename = f"{serializer.validated_data['email']}_{offer.title}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
            filepath = os.path.join(upload_dir, filename)
            
            with open(filepath, 'wb+') as f:
                for chunk in cv_file.chunks():
                    f.write(chunk)
            
            cv_url = f"/media/cvs/{filename}"
        
        # Créer la candidature
        application = JobApplication(
            offer=offer,
            offer_title=offer.title,
            first_name=serializer.validated_data['first_name'],
            last_name=serializer.validated_data['last_name'],
            email=serializer.validated_data['email'],
            phone=serializer.validated_data.get('phone', ''),
            current_position=serializer.validated_data.get('current_position', ''),
            experience_years=serializer.validated_data.get('experience_years', 0),
            cover_letter=serializer.validated_data['cover_letter'],
            cv_url=cv_url,
            portfolio_url=serializer.validated_data.get('portfolio_url', ''),
            linkedin_url=serializer.validated_data.get('linkedin_url', ''),
            status='pending'
        )
        application.save()
        
        return Response(
            {'detail': 'Candidature envoyée avec succès ! Nous vous contacterons bientôt.'},
            status=status.HTTP_201_CREATED
        )


class JobApplicationListView(APIView):
    """Liste des candidatures (admin/manager)"""
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminOrHRManager]
    
    def get(self, request):
        qs = JobApplication.objects.all()
        
        # Filtres
        offer_id = request.query_params.get('offer_id')
        if offer_id:
            qs = qs.filter(offer=ObjectId(offer_id))
        
        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter)
        
        applications = list(qs.order_by('-applied_date'))
        return Response(JobApplicationSerializer(applications, many=True).data)


class JobApplicationDetailView(APIView):
    """Détail et gestion d'une candidature"""
    authentication_classes = [MongoJWTAuthentication]
    permission_classes = [IsAuthenticated, IsAdminOrHRManager]
    
    def get(self, request, pk):
        try:
            application = JobApplication.objects.get(pk=ObjectId(pk))
            return Response(JobApplicationSerializer(application).data)
        except:
            return Response(
                {'detail': 'Candidature non trouvée'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    def patch(self, request, pk):
        """Modifier le statut d'une candidature"""
        try:
            application = JobApplication.objects.get(pk=ObjectId(pk))
        except:
            return Response(
                {'detail': 'Candidature non trouvée'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = JobApplicationReviewSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        
        application.status = serializer.validated_data['status']
        application.comments = serializer.validated_data.get('comments', '')
        application.reviewed_by = str(request.user.id)
        application.reviewed_at = datetime.utcnow()
        application.save()
        
        return Response(JobApplicationSerializer(application).data)