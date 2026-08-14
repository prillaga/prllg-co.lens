(function (global) {
  "use strict";

  var adminPin = "";
  var items = [];
  var localSeq = 1;
  var LOCAL_KEY = "prillaga_receipts_local_v1";

  function money(n) {
    var v = Number(n);
    if (!Number.isFinite(v) || v < 0) return 0;
    return Math.round(v * 100) / 100;
  }

  function formatPeso(n) {
    return "₱" + money(n).toLocaleString("en-PH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatReceiptNumber(seq) {
    return "REC-" + String(Math.max(1, Math.floor(seq || 1))).padStart(4, "0");
  }

  function todayISO() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, "0");
    var day = String(d.getDate()).padStart(2, "0");
    return d.getFullYear() + "-" + m + "-" + day;
  }

  function setStatus(text, tone) {
    var el = document.getElementById("receiptStatus");
    if (!el) return;
    el.textContent = text || "";
    el.style.color = tone === "error" ? "#e8a0a0" : tone === "warn" ? "#e8d080" : "#8ecf9a";
  }

  function toast(msg) {
    if (global.prillagaAdminToast) {
      global.prillagaAdminToast(msg);
      return;
    }
    var t = document.getElementById("toast");
    if (!t) return;
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toast._timer);
    toast._timer = setTimeout(function () { t.classList.remove("show"); }, 2600);
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function apiUrl() {
    if (global.prillagaReceiptsAdminApiUrl) return global.prillagaReceiptsAdminApiUrl();
    return "/api/receipts";
  }

  function loadLocal() {
    try {
      var raw = localStorage.getItem(LOCAL_KEY);
      var data = raw ? JSON.parse(raw) : { nextSequence: 1, receipts: [] };
      if (!data || typeof data !== "object") data = { nextSequence: 1, receipts: [] };
      if (!Array.isArray(data.receipts)) data.receipts = [];
      localSeq = Math.max(1, Number(data.nextSequence) || 1);
      return data;
    } catch (e) {
      return { nextSequence: 1, receipts: [] };
    }
  }

  function saveLocal(data) {
    try {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
    } catch (e) { /* ignore */ }
  }

  function defaultBusiness() {
    return {
      name: (global.PRILLAGA_BUSINESS_NAME || "Prillaga&Co. Lens").trim(),
      tagline: (global.PRILLAGA_BUSINESS_TAGLINE || "Camera & lens rental").trim(),
      email: (global.PRILLAGA_BUSINESS_EMAIL || "").trim(),
      phone: (global.PRILLAGA_BUSINESS_PHONE || "").trim(),
      address: (global.PRILLAGA_BUSINESS_ADDRESS || "Philippines").trim(),
      thankYou: "Thank you for renting with Prillaga&Co. Lens!"
    };
  }

  function computeTotals() {
    var subtotal = 0;
    items.forEach(function (item) {
      item.total = money((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0));
      subtotal += item.total;
    });
    subtotal = money(subtotal);
    var discount = money(document.getElementById("discount").value);
    if (discount > subtotal) discount = subtotal;
    var grandTotal = money(subtotal - discount);
    var amountPaid = money(document.getElementById("amountPaid").value);
    var balance = money(Math.max(0, grandTotal - amountPaid));
    return { subtotal: subtotal, discount: discount, grandTotal: grandTotal, amountPaid: amountPaid, balance: balance };
  }

  function syncFormTotals(totals) {
    document.getElementById("formSubtotal").textContent = formatPeso(totals.subtotal);
    document.getElementById("formDiscount").textContent = formatPeso(totals.discount);
    document.getElementById("formGrand").textContent = formatPeso(totals.grandTotal);
    document.getElementById("formPaid").textContent = formatPeso(totals.amountPaid);
    document.getElementById("formBalance").textContent = formatPeso(totals.balance);
  }

  function renderItems() {
    var list = document.getElementById("itemsList");
    if (!list) return;
    list.innerHTML = "";
    if (!items.length) {
      list.innerHTML = "<p style='color:#888;font-size:13px'>No items yet. Click Add item.</p>";
      return;
    }
    items.forEach(function (item, index) {
      var row = document.createElement("div");
      row.className = "receipt-item-row";
      row.innerHTML =
        '<div class="item-desc"><label>Description</label>' +
        '<input type="text" data-f="description" data-i="' + index + '" value="' + escapeHtml(item.description) + '" placeholder="Item or rental"></div>' +
        '<div><label>Qty</label><input type="number" min="0.01" step="0.01" data-f="quantity" data-i="' + index + '" value="' + item.quantity + '"></div>' +
        '<div><label>Unit price</label><input type="number" min="0" step="0.01" data-f="unitPrice" data-i="' + index + '" value="' + item.unitPrice + '"></div>' +
        '<div><label>Total</label><input type="text" readonly value="' + formatPeso(item.total) + '"></div>' +
        '<div><button type="button" class="reject" data-remove="' + index + '">Remove</button></div>';
      list.appendChild(row);
    });

    list.querySelectorAll("input[data-f]").forEach(function (input) {
      input.addEventListener("input", function () {
        var i = Number(input.getAttribute("data-i"));
        var f = input.getAttribute("data-f");
        if (!items[i]) return;
        if (f === "description") items[i].description = input.value;
        else items[i][f] = Number(input.value) || 0;
        refresh();
      });
    });
    list.querySelectorAll("button[data-remove]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var i = Number(btn.getAttribute("data-remove"));
        items.splice(i, 1);
        refresh();
      });
    });
  }

  function collectReceipt() {
    var totals = computeTotals();
    return {
      number: document.getElementById("receiptNumber").value.trim(),
      date: document.getElementById("receiptDate").value,
      rentalStart: document.getElementById("rentalStart").value,
      rentalEnd: document.getElementById("rentalEnd").value,
      customerName: document.getElementById("customerName").value.trim(),
      customerContact: document.getElementById("customerContact").value.trim(),
      transactionDetails: document.getElementById("transactionDetails").value.trim(),
      paymentMethod: document.getElementById("paymentMethod").value,
      notes: document.getElementById("notes").value.trim(),
      discount: totals.discount,
      amountPaid: totals.amountPaid,
      items: items.map(function (item) {
        return {
          description: String(item.description || "").trim(),
          quantity: Number(item.quantity) || 0,
          unitPrice: money(item.unitPrice),
          total: money((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))
        };
      }),
      business: {
        name: document.getElementById("bizName").value.trim(),
        tagline: document.getElementById("bizTagline").value.trim(),
        email: document.getElementById("bizEmail").value.trim(),
        phone: document.getElementById("bizPhone").value.trim(),
        address: document.getElementById("bizAddress").value.trim(),
        thankYou: document.getElementById("bizThanks").value.trim()
      },
      subtotal: totals.subtotal,
      grandTotal: totals.grandTotal,
      balance: totals.balance
    };
  }

  function validate(receipt) {
    var ok = true;
    document.getElementById("errDate").textContent = "";
    document.getElementById("errRental").textContent = "";
    document.getElementById("errCustomer").textContent = "";
    document.getElementById("errItems").textContent = "";

    if (!receipt.date) {
      document.getElementById("errDate").textContent = "Receipt date is required.";
      ok = false;
    }
    if (!receipt.rentalStart || !receipt.rentalEnd) {
      document.getElementById("errRental").textContent = "Rental start and end dates are required.";
      ok = false;
    } else if (receipt.rentalStart > receipt.rentalEnd) {
      document.getElementById("errRental").textContent = "Rental end must be on or after the start date.";
      ok = false;
    }
    if (!receipt.customerName) {
      document.getElementById("errCustomer").textContent = "Customer name is required.";
      ok = false;
    }
    var validItems = receipt.items.filter(function (i) {
      return i.description && i.quantity > 0;
    });
    if (!validItems.length) {
      document.getElementById("errItems").textContent = "Add at least one item with description and quantity.";
      ok = false;
    }
    return ok;
  }

  function renderPreview() {
    var receipt = collectReceipt();
    var sheet = document.getElementById("receiptSheet");
    if (!sheet) return;
    var biz = receipt.business;
    var rows = receipt.items
      .filter(function (i) { return i.description; })
      .map(function (i) {
        return (
          "<tr>" +
          "<td>" + escapeHtml(i.description) + "</td>" +
          '<td class="num">' + escapeHtml(String(i.quantity)) + "</td>" +
          '<td class="num">' + formatPeso(i.unitPrice) + "</td>" +
          '<td class="num">' + formatPeso(i.total) + "</td>" +
          "</tr>"
        );
      })
      .join("");

    if (!rows) {
      rows = '<tr><td colspan="4" style="color:#888">No items yet</td></tr>';
    }

    sheet.innerHTML =
      '<div class="brand">' +
      "<h1>" + escapeHtml(biz.name || "Prillaga&Co. Lens") + "</h1>" +
      "<p>" + escapeHtml(biz.tagline || "") + "</p>" +
      "<p>" +
      escapeHtml([biz.address, biz.phone, biz.email].filter(Boolean).join(" · ")) +
      "</p>" +
      "</div>" +
      '<div class="meta">' +
      "<div><strong>Receipt #</strong>" + escapeHtml(receipt.number || "—") + "</div>" +
      "<div><strong>Receipt date</strong>" + escapeHtml(receipt.date || "—") + "</div>" +
      "<div><strong>Customer</strong>" + escapeHtml(receipt.customerName || "—") + "</div>" +
      "<div><strong>Contact</strong>" + escapeHtml(receipt.customerContact || "—") + "</div>" +
      "<div><strong>Rental start</strong>" + escapeHtml(receipt.rentalStart || "—") + "</div>" +
      "<div><strong>Rental end</strong>" + escapeHtml(receipt.rentalEnd || "—") + "</div>" +
      "</div>" +
      (receipt.transactionDetails
        ? '<p style="font-size:12px;font-family:Arial,sans-serif;margin:0 0 8px;color:#444"><strong>Order:</strong> ' +
          escapeHtml(receipt.transactionDetails) +
          "</p>"
        : "") +
      "<table>" +
      "<thead><tr><th>Description</th><th class='num'>Qty</th><th class='num'>Unit</th><th class='num'>Total</th></tr></thead>" +
      "<tbody>" + rows + "</tbody>" +
      "</table>" +
      '<div class="summary">' +
      '<div class="summary-row"><span>Subtotal</span><span>' + formatPeso(receipt.subtotal) + "</span></div>" +
      '<div class="summary-row"><span>Discount</span><span>' + formatPeso(receipt.discount) + "</span></div>" +
      '<div class="summary-row total"><span>Total</span><span>' + formatPeso(receipt.grandTotal) + "</span></div>" +
      '<div class="summary-row"><span>Payment</span><span>' + escapeHtml(receipt.paymentMethod || "—") + "</span></div>" +
      '<div class="summary-row"><span>Amount paid</span><span>' + formatPeso(receipt.amountPaid) + "</span></div>" +
      '<div class="summary-row"><span>Balance due</span><span>' + formatPeso(receipt.balance) + "</span></div>" +
      "</div>" +
      (receipt.notes
        ? '<div class="notes"><strong>Notes:</strong>\n' + escapeHtml(receipt.notes) + "</div>"
        : "") +
      '<div class="thanks">' + escapeHtml(biz.thankYou || "Thank you!") + "</div>";
  }

  function refresh() {
    var totals = computeTotals();
    syncFormTotals(totals);
    renderItems();
    renderPreview();
  }

  function addItem(preset) {
    items.push({
      description: (preset && preset.description) || "",
      quantity: (preset && preset.quantity) || 1,
      unitPrice: (preset && preset.unitPrice) || 0,
      total: 0
    });
    refresh();
  }

  function resetForm(keepNumber) {
    var number = keepNumber ? document.getElementById("receiptNumber").value : formatReceiptNumber(localSeq);
    document.getElementById("receiptNumber").value = number;
    document.getElementById("receiptDate").value = todayISO();
    document.getElementById("rentalStart").value = todayISO();
    document.getElementById("rentalEnd").value = todayISO();
    document.getElementById("customerName").value = "";
    document.getElementById("customerContact").value = "";
    document.getElementById("transactionDetails").value = "";
    document.getElementById("paymentMethod").value = "GCash";
    document.getElementById("amountPaid").value = "0";
    document.getElementById("discount").value = "0";
    document.getElementById("notes").value = "";
    var biz = defaultBusiness();
    document.getElementById("bizName").value = biz.name;
    document.getElementById("bizTagline").value = biz.tagline;
    document.getElementById("bizEmail").value = biz.email;
    document.getElementById("bizPhone").value = biz.phone;
    document.getElementById("bizAddress").value = biz.address;
    document.getElementById("bizThanks").value = biz.thankYou;
    items = [];
    addItem({ description: "", quantity: 1, unitPrice: 0 });
    document.getElementById("errDate").textContent = "";
    document.getElementById("errRental").textContent = "";
    document.getElementById("errCustomer").textContent = "";
    document.getElementById("errItems").textContent = "";
  }

  function renderSavedList(receipts) {
    var ul = document.getElementById("savedReceiptList");
    if (!ul) return;
    ul.innerHTML = "";
    if (!receipts || !receipts.length) {
      ul.innerHTML = '<li style="color:#888">None yet.</li>';
      return;
    }
    receipts.slice(0, 20).forEach(function (r) {
      var li = document.createElement("li");
      li.textContent =
        (r.number || "") +
        " · " +
        (r.date || "") +
        " · " +
        (r.customerName || "") +
        " · " +
        formatPeso(r.grandTotal || 0);
      ul.appendChild(li);
    });
  }

  function fetchServerState(done) {
    fetch(apiUrl(), {
      cache: "no-store",
      headers: { Accept: "application/json", "X-Admin-Pin": adminPin }
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok) throw new Error((data && data.error) || "Could not load receipts.");
          done(null, data);
        });
      })
      .catch(function (err) {
        done(err);
      });
  }

  function saveReceipt() {
    var receipt = collectReceipt();
    if (!validate(receipt)) {
      setStatus("Fix the highlighted fields before saving.", "error");
      toast("Please complete required fields.");
      return;
    }

    setStatus("Saving receipt…");
    fetch(apiUrl(), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        "X-Admin-Pin": adminPin
      },
      body: JSON.stringify(receipt)
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok) throw new Error((data && data.error) || "Save failed.");
          return data;
        });
      })
      .then(function (data) {
        var saved = data.receipt || receipt;
        document.getElementById("receiptNumber").value = saved.number;
        if (data.store && data.store.nextSequence) {
          localSeq = data.store.nextSequence;
        } else {
          localSeq += 1;
        }
        var local = loadLocal();
        local.receipts.unshift(saved);
        local.nextSequence = localSeq;
        saveLocal(local);
        renderSavedList(local.receipts);
        setStatus("Receipt saved — " + saved.number);
        toast("Saved " + saved.number);
        document.getElementById("receiptNumber").value = formatReceiptNumber(localSeq);
      })
      .catch(function (err) {
        // Offline / no Supabase: save locally and still advance number
        var local = loadLocal();
        var localReceipt = Object.assign({}, receipt, {
          id: "local-" + Date.now(),
          createdAt: Date.now()
        });
        local.receipts.unshift(localReceipt);
        localSeq += 1;
        local.nextSequence = localSeq;
        saveLocal(local);
        renderSavedList(local.receipts);
        document.getElementById("receiptNumber").value = formatReceiptNumber(localSeq);
        setStatus("Saved in this browser only — " + (err.message || "server unavailable"), "warn");
        toast("Saved locally: " + localReceipt.number);
      });
  }

  function downloadPdf() {
    var receipt = collectReceipt();
    if (!validate(receipt)) {
      setStatus("Fix required fields before downloading.", "error");
      toast("Complete required fields first.");
      return;
    }

    var sheet = document.getElementById("receiptSheet");
    var html2canvas = global.html2canvas;
    var jsPDF = global.jspdf && global.jspdf.jsPDF;
    if (!html2canvas || !jsPDF) {
      setStatus("PDF libraries failed to load. Check your internet connection.", "error");
      toast("PDF library missing.");
      return;
    }

    setStatus("Generating PDF…");
    var btn = document.getElementById("btnDownloadPdf");
    if (btn) btn.disabled = true;

    html2canvas(sheet, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true
    })
      .then(function (canvas) {
        var img = canvas.toDataURL("image/png");
        var pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
        var pageWidth = pdf.internal.pageSize.getWidth();
        var pageHeight = pdf.internal.pageSize.getHeight();
        var margin = 12;
        var usableWidth = pageWidth - margin * 2;
        var imgHeight = (canvas.height * usableWidth) / canvas.width;
        var y = margin;
        if (imgHeight > pageHeight - margin * 2) {
          // Scale to fit one page
          var scale = (pageHeight - margin * 2) / imgHeight;
          usableWidth = usableWidth * scale;
          imgHeight = imgHeight * scale;
          y = margin;
        }
        var x = (pageWidth - usableWidth) / 2;
        pdf.addImage(img, "PNG", x, y, usableWidth, imgHeight);
        var filename = "Receipt-" + (receipt.number || "REC") + ".pdf";
        pdf.save(filename);
        setStatus("Downloaded " + filename);
        toast("Downloaded " + filename);
      })
      .catch(function (err) {
        setStatus("PDF failed — " + (err.message || String(err)), "error");
        toast("PDF download failed.");
      })
      .finally(function () {
        if (btn) btn.disabled = false;
      });
  }

  function printReceipt() {
    var receipt = collectReceipt();
    if (!validate(receipt)) {
      setStatus("Fix required fields before printing.", "error");
      return;
    }
    global.print();
  }

  function wireEvents() {
    document.getElementById("btnAddItem").addEventListener("click", function () {
      addItem();
    });
    ["discount", "amountPaid", "receiptDate", "rentalStart", "rentalEnd", "customerName", "customerContact", "transactionDetails", "paymentMethod", "notes", "bizName", "bizTagline", "bizEmail", "bizPhone", "bizAddress", "bizThanks"].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener("input", refresh);
      if (el) el.addEventListener("change", refresh);
    });
    document.getElementById("btnDownloadPdf").addEventListener("click", downloadPdf);
    document.getElementById("btnPrint").addEventListener("click", printReceipt);
    document.getElementById("btnSaveReceipt").addEventListener("click", saveReceipt);
    document.getElementById("btnReset").addEventListener("click", function () {
      if (!global.confirm("Clear the form and start a new receipt?")) return;
      resetForm(false);
      setStatus("Form cleared. Next number: " + document.getElementById("receiptNumber").value);
    });
  }

  global.prillagaInitReceiptPage = function (pin) {
    adminPin = pin || "";
    wireEvents();
    var local = loadLocal();
    localSeq = local.nextSequence || 1;
    resetForm(false);
    renderSavedList(local.receipts);
    setStatus("Loading receipt numbers…");

    fetchServerState(function (err, data) {
      if (err) {
        setStatus("Using local receipt numbers — server unavailable. " + err.message, "warn");
        document.getElementById("receiptNumber").value = formatReceiptNumber(localSeq);
        return;
      }
      if (data.nextNumber) {
        var m = /^REC-(\d+)$/i.exec(data.nextNumber);
        if (m) localSeq = Math.max(localSeq, parseInt(m[1], 10));
        document.getElementById("receiptNumber").value = data.nextNumber;
      }
      if (data.receipts && data.receipts.length) {
        var merged = data.receipts.slice();
        local.receipts.forEach(function (r) {
          if (!merged.some(function (x) { return x.number === r.number; })) merged.push(r);
        });
        local.receipts = merged;
        local.nextSequence = localSeq;
        saveLocal(local);
        renderSavedList(merged);
      }
      setStatus("Ready — next receipt " + document.getElementById("receiptNumber").value);
    });
  };
})(window);
