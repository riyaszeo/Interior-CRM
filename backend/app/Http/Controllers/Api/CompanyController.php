<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CompanyController extends Controller
{
    /**
     * Get company profile of the authenticated user.
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->company_id) {
            // Auto-create default company if user somehow doesn't have one
            $company = Company::create([
                'name' => 'My Company',
                'email' => $user->email,
            ]);
            $user->company_id = $company->id;
            $user->save();
        } else {
            $company = Company::find($user->company_id);
        }

        // Append public absolute url for logo if set
        if ($company->logo_path) {
            $company->logo_url = asset('storage/' . $company->logo_path);
        } else {
            $company->logo_url = null;
        }

        return response()->json([
            'success' => true,
            'message' => 'Company details retrieved.',
            'data' => $company
        ]);
    }

    /**
     * Update company details.
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->company_id) {
            $company = new Company();
        } else {
            $company = Company::find($user->company_id);
        }

        $validated = $request->validate([
            'name'       => 'required|string|max:255',
            'address'    => 'nullable|string',
            'gstn'       => 'nullable|string|max:50',
            'contact_no' => 'nullable|string|max:50',
            'email'      => 'nullable|email|max:255',
            'website'    => 'nullable|string|max:255',
            'logo'       => 'nullable|image|mimes:jpeg,png,jpg,gif,svg|max:2048',
        ]);

        $company->name = $validated['name'];
        $company->address = $validated['address'] ?? null;
        $company->gstn = $validated['gstn'] ?? null;
        $company->contact_no = $validated['contact_no'] ?? null;
        $company->email = $validated['email'] ?? null;
        $company->website = $validated['website'] ?? null;

        if ($request->hasFile('logo')) {
            // Delete old logo if exists
            if ($company->logo_path) {
                Storage::disk('public')->delete($company->logo_path);
            }

            // Store new logo
            $path = $request->file('logo')->store('logos', 'public');
            $company->logo_path = $path;
        }

        $company->save();

        if (!$user->company_id) {
            $user->company_id = $company->id;
            $user->save();
        }

        // Add public absolute url for response
        $company->logo_url = $company->logo_path ? asset('storage/' . $company->logo_path) : null;

        return response()->json([
            'success' => true,
            'message' => 'Company profile updated successfully.',
            'data' => $company
        ]);
    }
}
