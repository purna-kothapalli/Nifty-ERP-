import React, { useEffect, useState } from "react";
import axios from "axios";
import "./company.css";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Swal from "sweetalert2";

function Company() {
    const [stocks, setStocks] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [companyData, setCompanyData] = useState({
        companyName: "",
        companyPoint: 0,
        companyStatus: "BULLISH"
    });
    const [editCompanyData, setEditCompanyData] = useState({
        active: true,
        companyId: "",
        companyName: "",
        companyCode: "",
        companyPoint: 0,
    })
    const [isEditing, setIsEditing] = useState(false);

    // Function to generate next company code
    const getNextCompanyCode = () => {
        if (!stocks.length) return "#C00001";

        const lastCompany = stocks.reduce((max, company) => {
            const num = parseInt(company.companyCode.replace("#C", ""), 10);
            return num > max ? num : max;
        }, 0);

        return `#C${String(lastCompany + 1).padStart(5, "0")}`;
    };

    // Fetch company list on component mount
    useEffect(() => {
        axios
            .get("http://localhost:4000/get/company")
            .then((response) => {
                let fetchedStocks = response.data.data || [];
                setStocks(fetchedStocks.sort((a, b) => a.companyName.localeCompare(b.companyName)));
            })
            .catch((error) => console.error("Error fetching data:", error));
    }, []);

    // Handle input change in modal
    const handleChange = (e) => {
        const { name, value } = e.target;
        setCompanyData((prev) => ({
            ...prev,
            [name]: name === "companyPoint" ? parseFloat(value) || 0 : value
        }));
    };

    const handleEditChange = (e) => {
        const { name, value } = e.target;

        setEditCompanyData((prev) => ({
            ...prev,
            active: name === "companyStatus" ? value === "true" : prev.active,
            companyPoint: name === "companyPoint" ? (value ? parseFloat(value) : "") : prev.companyPoint
        }));
    };






    const handleEditConfirmation = (stock) => {
        const swalWithBootstrapButtons = Swal.mixin({
            customClass: {
                confirmButton: "btn btn-success",
                cancelButton: "btn btn-danger",
            },
            buttonsStyling: false,
        });
        swalWithBootstrapButtons
            .fire({
                title: `Edit ${stock.companyName}?`,
                text: `You are about to edit details for ${stock.companyName}.`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: "Yes",
                cancelButtonText: "No",
                reverseButtons: true,
            })
            .then((result) => {
                if (result.isConfirmed) {
                    setIsEditing(true);
                    setEditCompanyData({
                        companyName: stock.companyName,
                        companyId: stock.companyId,
                        active: stock.active,
                        companyCode: stock.companyCode,
                        companyPoint: stock.companyPoint,
                    });
                } else if (result.dismiss === Swal.DismissReason.cancel) {
                    swalWithBootstrapButtons.fire({
                        title: "Cancelled",
                        text: "Company details not updated!",
                        icon: "error",
                    });
                }
            });
    };

    // Open modal and reset form data
    const handleAddCompany = () => {
        setCompanyData({
            active: true,
            companyCode: getNextCompanyCode(),
            companyName: "",
            companyPoint: 0,
            companyStatus: "BULLISH",
            createdBy: "556c3d52-e18d-11ef-9b7f-02fd6cfaf985",
            liveBB: false,
        });
        setShowModal(true);
    };

    const handleEditCompanySubmit = async (e) => {
        e.preventDefault();
        const swalWithBootstrapButtons = Swal.mixin({
            customClass: {
                confirmButton: "btn btn-success",
                cancelButton: "btn btn-danger",
            },
            buttonsStyling: false,
        });

        try {
            const payload = {
                active: editCompanyData.active,
                companyId: editCompanyData.companyId,
                companyPoint: parseFloat(editCompanyData.companyPoint) || 0,
                companyName: editCompanyData.companyName
            };

            const response = await axios.post(
                "http://localhost:4000/company/update",
                payload,
                { headers: { "accept": "application/json", "Content-Type": "application/json" } }
            );
            toast.success("Company added successfully!", { position: "top-right" });

            setIsEditing(false);

            if (response.data?.data) {
                setStocks((prevStocks) =>
                    response.data.data.active
                        ? prevStocks
                            .map(company =>
                                company.companyId === response.data.data.companyId ? response.data.data : company
                            )
                            .sort((a, b) => (a.companyName || "").localeCompare(b.companyName || ""))
                        : prevStocks.filter(company => company.companyId !== response.data.data.companyId) // Remove inactive company
                );
            }
            swalWithBootstrapButtons.fire({
                title: "Updated.!",
                text: "Company changes Updated successfully",
                icon: "success",
            });

        } catch (error) {
            console.error("Error adding company:", error.response?.data || error.message);
            toast.error("Failed to add company. Try again!", { position: "top-right" });
            swalWithBootstrapButtons.fire({
                title: "Oops",
                text: "Something Went Wrong..!",
                icon: "error",
            });
        }
    };


    // Submit Edit company data
    const handleAddCompanySubmit = async (e) => {
        e.preventDefault();

        try {
            const payload = {
                active: companyData.active, // Ensuring correct active status
                companyName: companyData.companyName.trim().toUpperCase(),
                companyPoint: parseFloat(companyData.companyPoint) || 0,
                createdBy: "556c3d52-e18d-11ef-9b7f-02fd6cfaf985"
            };

            const response = await axios.post(
                "http://localhost:4000/company/create",
                payload,
                { headers: { "Accept": "application/json", "Content-Type": "application/json" } }
            );

            console.log("API Response:", response.data);
            toast.success("Company added successfully!", { position: "top-right" });

            setTimeout(() => {
                setIsEditing(false); // Ensure the modal closes properly
                if (response.data?.data) {
                    setStocks((prevStocks) =>
                        [...prevStocks, response.data.data]
                            .filter(company => company.companyName) // Ensure companyName is not null
                            .sort((a, b) => (a.companyName || "").localeCompare(b.companyName || ""))
                    );
                }
            }, 2000);


        } catch (error) {
            console.error("Error adding company:", error.response?.data || error.message);
            toast.error("Failed to add company. Try again!", { position: "top-right" });
        }
    };

    return (
        <div id="companyContainer" className="company-container">
            <h1>NIFTY 50 STOCKS</h1>
            <ToastContainer position="top-right" style={{ marginTop: "65px" }} />

            <div className="add-company-btn">
                <button className="company-submit-button" onClick={handleAddCompany}>
                    ADD COMPANY
                </button>
            </div>

            {isEditing && (
                <div className="company-popup">
                    <div className="company-popup-content">
                        <h2>Edit Company</h2>
                        <form onSubmit={handleEditCompanySubmit}>
                            <div className="company-form-group">
                                <label htmlFor="companyName">Company Name</label>
                                <input
                                    type="text"
                                    id="companyName"
                                    name="companyName"
                                    placeholder="Enter Company Name"
                                    value={editCompanyData.companyName.toUpperCase()}
                                    onChange={handleChange}
                                    readOnly
                                />
                            </div>

                            <div className="company-form-group">
                                <label htmlFor="companyCode">Company Code</label>
                                <input type="text" id="companyCode" name="companyCode" value={editCompanyData.companyCode} readOnly />
                            </div>

                            <div className="company-form-group">
                                <label>Active</label>
                                <div className="company-radio-group">
                                    <input
                                        type="radio"
                                        name="companyStatus"
                                        value="true"
                                        checked={editCompanyData.active === true}
                                        className="company-radio-input"
                                        onChange={handleEditChange}
                                    />
                                    <label className="company-radio-label">True</label>

                                    <input
                                        type="radio"
                                        name="companyStatus"
                                        value="false"
                                        checked={editCompanyData.active === false}
                                        className="company-radio-input"
                                        onChange={handleEditChange}
                                    />
                                    <label className="company-radio-label">False</label>
                                </div>
                            </div>

                            <div className="company-form-group">
                                <label htmlFor="companyPoint">Company Point</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    id="companyPoint"
                                    name="companyPoint"
                                    placeholder="Enter Points"
                                    value={editCompanyData.companyPoint}
                                    onChange={handleEditChange}
                                    required
                                />
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="holiday-cancel-btn" onClick={() => setIsEditing(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="holiday-submit-btn">
                                    Submit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="company-popup">
                    <div className="company-popup-content">
                        <h2>Add Company</h2>
                        <form onSubmit={handleAddCompanySubmit}>
                            <div className="company-form-group">
                                <label htmlFor="companyName">Company Name</label>
                                <input
                                    type="text"
                                    id="companyName"
                                    name="companyName"
                                    placeholder="Enter Company Name"
                                    value={companyData.companyName}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="company-form-group">
                                <label htmlFor="companyCode">Company Code</label>
                                <input type="text" id="companyCode" name="companyCode" value={companyData.companyCode} readOnly />
                            </div>

                            <div className="company-form-group">
                                <label>Status</label>
                                <div className="company-radio-group">
                                    <input
                                        type="radio"
                                        name="companyStatus"
                                        value="BULLISH"
                                        checked={companyData.companyStatus === "BULLISH"}
                                        className="company-radio-input"
                                        onChange={handleChange}
                                    />
                                    <label className="company-radio-label">Bullish</label>

                                    <input
                                        type="radio"
                                        name="companyStatus"
                                        value="BEARISH"
                                        checked={companyData.companyStatus === "BEARISH"}
                                        className="company-radio-input"
                                        onChange={handleChange}
                                    />
                                    <label className="company-radio-label">Bearish</label>
                                </div>
                            </div>

                            <div className="company-form-group">
                                <label htmlFor="companyPoint">Company Point</label>
                                <input
                                    type="number"
                                    step="0.25"
                                    min="0"
                                    id="companyPoint"
                                    name="companyPoint"
                                    placeholder="Enter Points"
                                    value={companyData.companyPoint}
                                    onChange={(e) => {
                                        let value = e.target.value;

                                        // Prevent negative and strip leading zeros (except for valid 0.x)
                                        if (value === "" || parseFloat(value) < 0) return;

                                        if (value.length > 1 && value.startsWith("0") && !value.startsWith("0.")) {
                                            value = value.replace(/^0+/, "");
                                        }

                                        setCompanyData((prev) => ({
                                            ...prev,
                                            companyPoint: value
                                        }));
                                    }}
                                    required
                                />


                            </div>

                            <div className="modal-actions">
                                <button type="button" className="holiday-cancel-btn" onClick={() => setShowModal(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="holiday-submit-btn">
                                    Submit
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {!showModal && !isEditing && (
                <ul className="company-stocks-container">
                    {stocks.map((stock, index) => (
                        <li key={index} className="company-stock-box" onClick={() => handleEditConfirmation(stock)}>
                            <span className="company-stock-symbol">{stock.companyName}</span>
                            <span className="company-stock-value">
                                {isNaN(stock.companyPoint) ? "0" : Math.max(Number(stock.companyPoint), 0)}
                            </span>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

export default Company;
