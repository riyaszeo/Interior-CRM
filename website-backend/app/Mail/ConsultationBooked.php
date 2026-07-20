<?php

namespace App\Mail;

use App\Models\Consultation;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ConsultationBooked extends Mailable
{
    use Queueable, SerializesModels;

    public $consultation;

    /**
     * Create a new message instance.
     */
    public function __construct(Consultation $consultation)
    {
        $this->consultation = $consultation;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject('New Design Consultation Booking Request')
                    ->view('emails.consultation_booked');
    }
}
