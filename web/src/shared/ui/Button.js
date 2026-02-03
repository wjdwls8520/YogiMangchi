"use client";

import React from 'react';
import './Button.css';

/**
 * Reusable Button Component
 * @param {object} props
 * @param {'primary' | 'secondary' | 'ghost'} [props.variant='primary']
 * @param {'sm' | 'md' | 'lg'} [props.size='md']
 * @param {boolean} [props.fullWidth=false]
 * @param {string} [props.className='']
 * @param {React.ReactNode} props.children
 * @param {React.ButtonHTMLAttributes<HTMLButtonElement>} props.rest
 */
const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    className = '',
    ...rest
}) => {
    const classes = [
        'button',
        `button${variant.charAt(0).toUpperCase() + variant.slice(1)}`, // primary -> buttonPrimary
        `button${size.charAt(0).toUpperCase() + size.slice(1)}`, // sm -> buttonSm
        fullWidth ? 'buttonFull' : '',
        'cursor',
        className
    ].filter(Boolean).join(' ');

    return (
        <button className={classes} {...rest}>
            {children}
        </button>
    );
};

export default Button;
