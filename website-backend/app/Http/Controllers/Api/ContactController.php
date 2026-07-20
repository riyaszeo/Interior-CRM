<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consultation;
use App\Models\Inquiry;
use App\Mail\ConsultationBooked;
use App\Mail\InquirySubmitted;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ContactController extends Controller
{
    /**
     * Submit a book consultation form.
     */
    public function bookConsultation(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'mobile' => 'required|string|max:20',
            'email' => 'nullable|email|max:255',
            'city' => 'required|string|max:255',
            'property_type' => 'required|string|max:255',
            'budget' => 'required|string|max:255',
            'area_sqft' => 'required|string|max:255',
            'service_type' => 'required|string|in:Interior,Exterior',
            'preferred_date' => 'nullable|date',
            'message' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $consultation = Consultation::create($validator->validated());

        // Dispatch Email Notification
        try {
            Mail::to('vksinteriorcoimbatore@gmail.com')->send(new ConsultationBooked($consultation));
        } catch (\Exception $e) {
            Log::error('Mail dispatch failed for consultation #' . $consultation->id . ': ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Consultation booked successfully. Our experts will contact you shortly.',
            'data' => $consultation,
        ], 201);
    }

    /**
     * Submit a contact inquiry form.
     */
    public function submitInquiry(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'subject' => 'required|string|max:255',
            'message' => 'required|string|max:2000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors(),
            ], 422);
        }

        $inquiry = Inquiry::create($validator->validated());

        // Dispatch Email Notification
        try {
            Mail::to('vksinteriorcoimbatore@gmail.com')->send(new InquirySubmitted($inquiry));
        } catch (\Exception $e) {
            Log::error('Mail dispatch failed for inquiry #' . $inquiry->id . ': ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Inquiry submitted successfully. We will respond to your request shortly.',
            'data' => $inquiry,
        ], 201);
    }
}
