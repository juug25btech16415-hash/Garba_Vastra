# 💃 Garba Vastra
![Uploading logooo.png…]()


[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](#)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](#)
[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](#)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](#)

A full-stack e-commerce platform dedicated to bringing authentic, hand-embroidered Gujarati festive wear to a digital audience while directly supporting local artisans and small businesses. 

---

## 📑 Table of Contents
* [Project Overview](#-project-overview)
* [Tech Stack](#-tech-stack)
* [System Flow](#-system-flow)
* [Features & Database](#-features--database)

---

## 🌟 Project Overview
Garba Vastra is engineered to handle the complete e-commerce lifecycle, from secure user browsing to physical order fulfillment. Developed as a solo initiative by a Computer Science Engineering student, it combines scalable web technologies with clean, responsive design to offer a seamless shopping experience for traditional Navratri outfits.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React & Tailwind CSS | Responsive, dynamic UI and localized state management. |
| **Backend & DB** | Supabase (PostgreSQL) | Secure relational data storage and user authentication. |
| **Logistics** | Shiprocket API | Automated shipping integration and AWB tracking. |
| **Deployment** | Vercel | Fast, global edge network hosting and CI/CD pipelines. |

---

## 🔄 System Flow

```mermaid
graph TD;
    A[Customer] -->|Browses & Orders| B(React Storefront)
    B -->|Fetches Data| C[(Secure Database)]
    C -->|Validates Identity| D{Admin Dashboard}
    D -->|Fulfills Order| E[Logistics API]
    E -->|Updates AWB Tracking| B
