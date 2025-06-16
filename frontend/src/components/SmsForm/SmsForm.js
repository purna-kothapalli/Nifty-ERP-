import React, { useState } from 'react';
import axios from 'axios';
import './SmsForm.css'; // <-- Add this line

const SmsForm = () => {
  const [numbers, setNumbers] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    const numberList = numbers
      .split(',')
      .map((num) => num.trim())
      .filter((num) => num.length > 0);

    try {
      const res = await axios.post('https://dev-erp.nifty10.in/send-sms', {
        numbers: numberList,
        message,
      });

      setStatus(`Success: ${res.data.message}`);
    } catch (error) {
      setStatus(`Error: ${error.response?.data?.error || error.message}`);
    }
  };

  return (
    <div className="sms-form-container">
    <div style={{ maxWidth: '500px', margin: 'auto' }}>
      <h2>Send Bulk SMS</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Phone Numbers (comma-separated)</label><br />
          <input
            type="text"
            value={numbers}
            onChange={(e) => setNumbers(e.target.value)}
            placeholder="e.g. 919876543210,918123456789"
            required
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <label>Message</label><br />
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your message"
            rows="4"
            required
            style={{ width: '100%' }}
          />
        </div>
        <button type="submit">Send SMS</button>
      </form>
      {status && <p>{status}</p>}
    </div></div>
  );
};

export default SmsForm;
