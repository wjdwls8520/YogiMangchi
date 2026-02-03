"use client";

import React, { useState } from 'react';

const OrderForm = () => {
    const [activeTab, setActiveTab] = useState('buy'); // 'buy' or 'sell'
    const [price, setPrice] = useState('74200');
    const [amount, setAmount] = useState('');

    return (
        <div className="orderFormContainer">
            {/* Tabs */}
            <div className="orderTabs">
                <button
                    className={`orderTab buy ${activeTab === 'buy' ? 'active' : ''}`}
                    onClick={() => setActiveTab('buy')}
                >
                    매수
                </button>
                <button
                    className={`orderTab sell ${activeTab === 'sell' ? 'active' : ''}`}
                    onClick={() => setActiveTab('sell')}
                >
                    매도
                </button>
            </div>

            {/* Inputs */}
            <div className="orderInputs">
                <div className="orderInputRow">
                    <span className="inputLabel">{activeTab === 'buy' ? '매수' : '매도'}가격</span>
                    <div className="orderInputGroup">
                        <input
                            type="text"
                            className="orderInput"
                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                        />
                        <span className="unit">원</span>
                    </div>
                </div>

                <div className="orderInputRow">
                    <span className="inputLabel">주문수량</span>
                    <div className="orderInputGroup">
                        <input
                            type="text"
                            className="orderInput"
                            value={amount}
                            placeholder="0"
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <span className="unit">주</span>
                    </div>
                </div>

                <div className="orderInputRow">
                    <span className="inputLabel">주문총액</span>
                    <div className="orderInputGroup" style={{ border: 'none', background: 'transparent' }}>
                        <input
                            type="text"
                            className="orderInput"
                            value={price && amount ? (parseInt(price) * parseInt(amount)).toLocaleString() : '0'}
                            readOnly
                            style={{ fontWeight: 'bold' }}
                        />
                        <span className="unit">원</span>
                    </div>
                </div>

                {/* Percent Buttons */}
                <div className="percentBtns">
                    {['10%', '25%', '50%', '100%'].map(p => (
                        <button key={p} className="percentBtn">{p}</button>
                    ))}
                </div>

                {/* Submit Button */}
                <button className={`orderSubmitBtn ${activeTab}`}>
                    {activeTab === 'buy' ? '매수하기' : '매도하기'}
                </button>
            </div>

            <div style={{ marginTop: '24px', fontSize: '13px', color: '#666', borderTop: '1px solid #eee', paddingTop: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>주문가능</span>
                    <span style={{ fontWeight: 'bold' }}>1,500,000 KRW</span>
                </div>
            </div>
        </div>
    );
};

export default OrderForm;
