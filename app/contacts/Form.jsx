"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { DetectOS, GetBrowser } from "@/services/getUserDevices";
import { Telmask, pasteCallback } from "@/lib/telmask";
import { utmKeys } from "@/lib/umt";
import { fetchIp } from "@/services/ip";
import { SendForm } from "@/services/sendForm";
import Toast from "@/components/Modals/Toast";
//import InfoModal from "@/components/Modals/InfoModal";
import "./style.css";

export default function Form() {
  const searchParams = useSearchParams();
  const [ip, setIp] = useState();
  const [utmParams, setUtmParams] = useState(null);
  const phoneInput = useRef(null);
  const [buttonEnabled, setbuttonEnabled] = useState(false);
  const router = useRouter();

  const [toastOpen, setToastOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [typeToast, SetTypeToast] = useState();

  const ToggleBtn = (value) => {
    if (value.length === 16) {
      setbuttonEnabled(true);
    } else {
      setbuttonEnabled(false);
    }
  };

  const checkPhoneInput = (event) => {
    let { value } = event.target;
    value = Telmask(event);
    ToggleBtn(value);
  };

  const checkPhonePaste = (event) => {
    const { value } = event.target;
    pasteCallback(event);
    ToggleBtn(value);
  };

  function checkFocus() {
    let phoneEl = phoneInput.current;
    Telmask({ target: phoneEl });
  }

  useEffect(() => {
    if (searchParams) {
      const params = Object.fromEntries(searchParams.entries());
      const filteredParams = utmKeys.reduce((acc, key) => {
        if (params[key]) acc[key] = params[key];
        return acc;
      }, {});

      setUtmParams(filteredParams);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchIp().then(setIp);
  }, []);

  function ResultSendFormSuccess(data) {
    let status = data.data.status;
    if (status === 1) {
      SetTypeToast("success");
      router.push("/thanks");
    } else if (status === 2) {
      setInfoOpen(true);
    } else {
      console.error("неизвесный статус");
    }
  }

  function ResultSendFormErr() {
    setToastOpen(true);
    SetTypeToast("error");
  }

  useEffect(() => {
    if (infoOpen) {
      const timeoutId = setTimeout(() => {
        setInfoOpen(false);
      }, 5000);

      return () => clearTimeout(timeoutId);
    }
  }, [infoOpen]);

  async function Record(event) {
    setbuttonEnabled(false);
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    formData.append("utm_source", utmParams.utm_source);
    formData.append("utm_source_type", utmParams.utm_source_type);
    formData.append("utm_medium", utmParams.utm_medium);
    formData.append("utm_campaign", utmParams.utm_campaign);
    formData.append("utm_campaign_name", utmParams.utm_campaign_name);
    formData.append("utm_content", utmParams.utm_content);
    formData.append("utm_region_name", utmParams.utm_region_name);
    formData.append("utm_term", utmParams.utm_term);
    formData.append("utm_placement", utmParams.utm_placement);
    formData.append("utm_position", utmParams.utm_position);
    formData.append("utm_position_type", utmParams.utm_position_type);
    formData.append("utm_device", utmParams.utm_device);
    formData.append("yclid", utmParams.yclid);
    formData.append("platform", DetectOS());
    formData.append("browser", GetBrowser());
    formData.append("ip", ip);
    formData.set("phone", formData.get("phone").replace(/[- )(]/g, ""));

    let formObject = {};
    formData.forEach(function (value, key) {
      formObject[key] = value;
    });
    const json = JSON.stringify(formObject);

    SendForm(json)
      .then((data) => ResultSendFormSuccess(data))
      .catch((error) => ResultSendFormErr(error));
  }

  return (
    <>
      <form
        action=""
        method="post"
        className="form-box flex-wrap"
        onSubmit={Record}
      >
        <div className="title">У вас есть вопрос? Напишите его нам </div>
        <div className="input-wr">
          <div className="input-box">
            <input
              type="text"
              name="fullname"
              autoComplete="off"
              placeholder="Как к вам обращаться"
              required
              minLength="2"
              maxLength="25"
              className="suggestions-input"
              style={{ boxSizing: "border-box" }}
            />
            <div className="suggestions-wrapper">
              <div
                className="suggestions-suggestions"
                style={{ display: "none" }}
              ></div>
            </div>
          </div>
          <input
            type="tel"
            name="phone"
            placeholder="Номер телефона"
            pattern="\+7\s\([0-68-9]{1}[0-9]{2}\)\s[0-9]{3}-[0-9]{2}-[0-9]{2}"
            required
            ref={phoneInput}
            onChange={checkPhoneInput}
            onPaste={checkPhonePaste}
            onFocus={checkFocus}
          />
          <input
            type="email"
            name="email"
            placeholder="Ваш e-mail"
            pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$"
            required
          />
        </div>
        <textarea
          name="message"
          placeholder="Напишите свой вопрос..."
          required
        ></textarea>

        <button className="btn-yellow btn btn-form">Отправить сообщение</button>
        <div className="polit-descr contacts-btn">
          Нажимая кнопку &quot;Отправить сообщение&quot;, я подтверждаю, что
          ознакомлен и согласен с условиями &nbsp;
          <Link href="/policy" target="_blank" className="polit">
            политики обработки персональных данных
          </Link>
        </div>
      </form>

      {toastOpen && (
        <Toast
          typeToast={typeToast}
          setToastOpen={setToastOpen}
          toastOpen={toastOpen}
        />
      )}
      {/*
      {infoOpen && <InfoModal setInfoOpen={setInfoOpen} infoOpen={infoOpen} />}*/}
    </>
  );
}
