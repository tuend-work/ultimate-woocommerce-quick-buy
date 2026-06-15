/**
 * Javascript for Ultimate WooCommerce Quick Buy
 * Custom Premium Logic with Smooth UI Transitions and Responsive AJAX Actions
 */

(function($) {
    'use strict';

    $(document).ready(function() {
        // Create Modal Overlay if not already present
        if ($('.uwc-modal-overlay').length === 0) {
            $('body').append('<div class="uwc-modal-overlay"></div>');
        }

        var overlay = $('.uwc-modal-overlay');

        // Close functions
        function closeAllModals() {
            $('.uwc-popup-quickbuy').removeClass('open');
            overlay.removeClass('open');
            $('html, body').removeClass('uwc-modal-open');
        }

        $(document).on('click', '.uwc-popup-close, .uwc-modal-overlay', function(e) {
            e.preventDefault();
            closeAllModals();
        });

        $(document).on('keyup', function(e) {
            if (e.key === "Escape") {
                closeAllModals();
            }
        });

        // Open modal event
        $(document).on('click', '.uwc_buy_now', function(e) {
            e.preventDefault();
            var prodId = $(this).attr('data-id');
            var modal = $('#popup_content_' + prodId);
            
            if (modal.length > 0) {
                if (modal.hasClass('ghn_not_loaded') || modal.find('.uwc-popup-content').html().trim() === '') {
                    loadPopupContentAjax(prodId, modal);
                } else {
                    openModal(modal);
                }
            } else {
                // If not found in footer, inject dummy shell and pull via AJAX
                var newModal = $('<div class="uwc-popup-quickbuy ghn_not_loaded" id="popup_content_' + prodId + '"><div class="uwc-popup-inner"><div class="uwc-popup-title"><span>Đang tải...</span><button type="button" class="uwc-popup-close"></button></div><div class="uwc-popup-content"></div></div></div>');
                $('body').append(newModal);
                loadPopupContentAjax(prodId, newModal);
            }
        });

        function openModal(modal) {
            closeAllModals();
            modal.addClass('open');
            overlay.addClass('open');
            $('html, body').addClass('uwc-modal-open');
            
            // Trigger WC variation form behaviors if present
            var varForm = modal.find('.variations_form');
            if (varForm.length > 0) {
                varForm.wc_variation_form();
            }

            initValidation(modal);
            initLocationEvents(modal);
            calculateTotalPrice(modal);
        }

        function loadPopupContentAjax(prodId, modal) {
            modal.find('.uwc-popup-content').html(
                '<div style="grid-column: 1 / span 2; padding:60px 20px; text-align:center; color:#64748b; font-weight:500;">' +
                '   <div style="border:3px solid #cbd5e1; border-top-color:#3b82f6; border-radius:50%; width:36px; height:36px; animation: uwc-spin 0.8s linear infinite; margin: 0 auto 16px;"></div>' +
                '   Đang tải dữ liệu sản phẩm...' +
                '</div>'
            );
            openModal(modal);

            $.ajax({
                url: uwc_quickbuy_array.ajaxurl,
                type: 'POST',
                data: {
                    action: 'uwc_form_quickbuy',
                    prodid: prodId
                },
                success: function(res) {
                    if (res) {
                        modal.removeClass('ghn_not_loaded');
                        modal.replaceWith(res);
                        var updatedModal = $('#popup_content_' + prodId);
                        openModal(updatedModal);
                    } else {
                        modal.find('.uwc-popup-content').html('<div style="grid-column: 1 / span 2; padding:40px; text-align:center; color:#ef4444; font-weight:600;">Sản phẩm tạm thời không khả dụng.</div>');
                    }
                },
                error: function() {
                    modal.find('.uwc-popup-content').html('<div style="grid-column: 1 / span 2; padding:40px; text-align:center; color:#ef4444; font-weight:600;">Lỗi máy chủ. Vui lòng tải lại trang.</div>');
                }
            });
        }

        // Listen for variation selection events
        $(document).on('found_variation', '.variations_form', function(e, variation) {
            var popup = $(this).closest('.uwc-popup-quickbuy');
            
            popup.find('input[name="variation_id"]').val(variation.variation_id);
            
            if (variation.image && variation.image.thumb_src) {
                popup.find('.uwc-popup-img img').attr('src', variation.image.thumb_src);
            }
            
            if (variation.price_html) {
                popup.find('.uwc-popup-info .uwc_price').html(variation.price_html);
            }
            
            popup.find('.uwc-prod-variable').attr('data-simpleprice', variation.display_price);
            calculateTotalPrice(popup);
        });

        $(document).on('reset_data', '.variations_form', function() {
            var popup = $(this).closest('.uwc-popup-quickbuy');
            popup.find('input[name="variation_id"]').val('');
            calculateTotalPrice(popup);
        });

        // Price formatting helper
        function formatPrice(value) {
            var decimalSep = uwc_quickbuy_array.price_decimal || ',';
            var thousandSep = uwc_quickbuy_array.price_thousand || '.';
            var decimals = parseInt(uwc_quickbuy_array.num_decimals || 0, 10);
            var currencySymbol = uwc_quickbuy_array.currency_format || 'đ';

            var num = parseFloat(value);
            if (isNaN(num)) return '';

            var fixedNum = num.toFixed(decimals);
            var parts = fixedNum.split('.');
            parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandSep);
            
            var formatted = parts.join(decimalSep);
            return formatted + ' ' + currencySymbol;
        }

        // Totals Calculation
        function calculateTotalPrice(popup) {
            var qty = parseInt(popup.find('input[name="quantity"]').val() || 1, 10);
            var basePrice = parseFloat(popup.find('.uwc-prod-variable').attr('data-simpleprice') || 0);
            var subtotal = basePrice * qty;
            
            var shipCost = 0;
            var checkedShip = popup.find('.shipping_method:checked');
            if (checkedShip.length > 0) {
                shipCost = parseFloat(checkedShip.attr('data-cost') || 0);
            }

            var couponVal = parseFloat(popup.find('.coupon_amout_val').val() || 0);

            var total = subtotal + shipCost - couponVal;
            if (total < 0) total = 0;

            popup.find('.popup_quickbuy_total_calc').html(formatPrice(total));
            popup.find('input[name="order_total"]').val(total);
        }

        // Quantity input watchers
        $(document).on('change keyup', '.uwc-popup-quickbuy input[name="quantity"]', function() {
            var popup = $(this).closest('.uwc-popup-quickbuy');
            calculateTotalPrice(popup);
            triggerShippingCalc(popup);
        });

        // Dynamic Address Dropdowns (City -> District -> Ward)
        function initLocationEvents(popup) {
            popup.find('#uwc_city').off('change').on('change', function() {
                var cityId = $(this).val();
                var districtSelect = popup.find('#uwc_district');
                var wardSelect = popup.find('#uwc_ward');
                
                districtSelect.html('<option value="">Đang tải Quận/Huyện...</option>');
                wardSelect.html('<option value="">Phường/Xã</option>');
                
                $.ajax({
                    url: uwc_quickbuy_array.ajaxurl,
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        action: 'uwc_load_diagioihanhchinh',
                        matp: cityId,
                        getvalue: 1,
                        product_info: popup.find('.uwc_custom_info').serialize(),
                        prod_id: popup.find('input[name="prod_id"]').val()
                    },
                    success: function(res) {
                        if (res.success) {
                            var districts = res.data.list_district;
                            var html = '<option value="">Chọn Quận/Huyện</option>';
                            $.each(districts, function(key, val) {
                                html += '<option value="' + val.maqh + '">' + val.name + '</option>';
                            });
                            districtSelect.html(html);

                            if (res.data.shipping) {
                                popup.find('.popup_quickbuy_shipping_calc').html(res.data.shipping);
                                calculateTotalPrice(popup);
                            }
                        } else {
                            districtSelect.html('<option value="">Quận/Huyện</option>');
                        }
                    }
                });
            });

            popup.find('#uwc_district').off('change').on('change', function() {
                var districtId = $(this).val();
                var wardSelect = popup.find('#uwc_ward');
                
                wardSelect.html('<option value="">Đang tải Phường/Xã...</option>');
                
                $.ajax({
                    url: uwc_quickbuy_array.ajaxurl,
                    type: 'POST',
                    dataType: 'json',
                    data: {
                        action: 'uwc_load_diagioihanhchinh',
                        maqh: districtId,
                        getvalue: 2,
                        product_info: popup.find('.uwc_custom_info').serialize(),
                        prod_id: popup.find('input[name="prod_id"]').val()
                    },
                    success: function(res) {
                        if (res.success) {
                            var wards = res.data.list_district;
                            var html = '<option value="">Chọn Phường/Xã</option>';
                            $.each(wards, function(key, val) {
                                html += '<option value="' + val.xaid + '">' + val.name + '</option>';
                            });
                            wardSelect.html(html);
                            
                            triggerShippingCalc(popup);
                        } else {
                            wardSelect.html('<option value="">Phường/Xã</option>');
                        }
                    }
                });
            });

            // Update on ward change too
            popup.find('#uwc_ward').off('change').on('change', function() {
                triggerShippingCalc(popup);
            });

            popup.find('.uwc-popup-content').off('change', '.shipping_method').on('change', '.shipping_method', function() {
                calculateTotalPrice(popup);
            });
        }

        function triggerShippingCalc(popup) {
            var cityId = popup.find('#uwc_city').val();
            var districtId = popup.find('#uwc_district').val();
            if (!cityId) return;

            $.ajax({
                url: uwc_quickbuy_array.ajaxurl,
                type: 'POST',
                dataType: 'json',
                data: {
                    action: 'uwc_load_diagioihanhchinh',
                    matp: cityId,
                    maqh: districtId,
                    getvalue: 0,
                    product_info: popup.find('.uwc_custom_info').serialize(),
                    prod_id: popup.find('input[name="prod_id"]').val()
                },
                success: function(res) {
                    if (res.success && res.data.shipping) {
                        popup.find('.popup_quickbuy_shipping_calc').html(res.data.shipping);
                        calculateTotalPrice(popup);
                    }
                }
            });
        }

        // Apply Coupon Code
        $(document).on('click', '.uwc-popup-quickbuy button.apply_coupon', function(e) {
            e.preventDefault();
            var btn = $(this);
            var popup = btn.closest('.uwc-popup-quickbuy');
            var couponField = popup.find('input.customer-coupon');
            var couponCode = couponField.val().trim();
            var messBox = popup.find('.quickbuy_coupon_mess');
            var amountBox = popup.find('.quickbuy_coupon_mess_amout');
            
            if (!couponCode) {
                alert('Vui lòng nhập mã giảm giá!');
                return;
            }

            btn.text('Đang thử...').prop('disabled', true);

            $.ajax({
                url: uwc_quickbuy_array.ajaxurl,
                type: 'POST',
                dataType: 'json',
                data: {
                    action: 'uwc_apply_coupon',
                    prod_id: popup.find('input[name="prod_id"]').val(),
                    thisCoupon: couponCode,
                    product_info: popup.find('.uwc_custom_info').serialize()
                },
                success: function(res) {
                    btn.text('Áp dụng').prop('disabled', false);
                    if (res.success && res.data) {
                        messBox.html(res.data.mess);
                        if (res.data.total_discount > 0) {
                            amountBox.find('.quickbuy_coupon_amout').text(formatPrice(res.data.total_discount));
                            amountBox.show();
                            popup.find('.coupon_amout_val').val(res.data.total_discount);
                        } else {
                            amountBox.hide();
                            popup.find('.coupon_amout_val').val(0);
                        }
                        calculateTotalPrice(popup);
                    } else {
                        messBox.html('<span style="color:#ef4444;">Áp dụng mã giảm giá thất bại.</span>');
                        amountBox.hide();
                        popup.find('.coupon_amout_val').val(0);
                        calculateTotalPrice(popup);
                    }
                },
                error: function() {
                    btn.text('Áp dụng').prop('disabled', false);
                    alert('Lỗi khi áp dụng coupon.');
                }
            });
        });

        // Form Validation Setup
        function initValidation(modal) {
            var form = modal.find('.uwc_custom_info');
            if (typeof $.fn.validate === 'undefined') {
                return;
            }

            form.validate({
                rules: {
                    'customer-name': {
                        required: true,
                        minlength: 2
                    },
                    'customer-phone': {
                        required: true,
                        digits: true,
                        minlength: 9,
                        maxlength: 11
                    },
                    'customer-email': {
                        required: function() {
                            return form.find('input[name="customer-email"]').attr('data-required') === 'true';
                        },
                        email: true
                    },
                    'customer-quan': {
                        required: function() {
                            return form.find('#require_district').val() == '1';
                        }
                    },
                    'customer-xa': {
                        required: function() {
                            return form.find('#require_village').val() == '1';
                        }
                    },
                    'customer-address': {
                        required: function() {
                            return form.find('#require_address').val() == '1';
                        }
                    }
                },
                messages: {
                    'customer-name': uwc_quickbuy_array.name_text,
                    'customer-phone': uwc_quickbuy_array.phone_text,
                    'customer-email': uwc_quickbuy_array.email_text,
                    'customer-quan': uwc_quickbuy_array.quan_text,
                    'customer-xa': uwc_quickbuy_array.xa_text,
                    'customer-address': uwc_quickbuy_array.address_text
                },
                errorElement: 'div',
                errorClass: 'uwc-error-message',
                errorPlacement: function(error, element) {
                    error.insertAfter(element);
                }
            });
        }

        // Submit Order Action
        $(document).on('click', '.uwc-popup-quickbuy .uwc-order-btn', function(e) {
            e.preventDefault();
            var btn = $(this);
            var popup = btn.closest('.uwc-popup-quickbuy');
            var form = popup.find('.uwc_custom_info');
            var messBox = popup.find('.uwc_quickbuy_mess');

            // Validate variations
            var varForm = popup.find('.variations_form');
            if (varForm.length > 0) {
                var variationId = popup.find('input[name="variation_id"]').val();
                if (!variationId || variationId === '0') {
                    alert('Vui lòng chọn đầy đủ các thuộc tính của sản phẩm trước khi mua hàng.');
                    return;
                }
            }

            // Validate using plugin
            if (typeof $.fn.validate !== 'undefined') {
                if (!form.valid()) {
                    return;
                }
            }

            btn.addClass('loading').prop('disabled', true);
            messBox.removeClass('error').html('');

            $.ajax({
                url: uwc_quickbuy_array.ajaxurl,
                type: 'POST',
                data: {
                    action: 'uwc_quickbuy',
                    prod_id: popup.find('input[name="prod_id"]').val(),
                    customer_info: form.serialize(),
                    product_info: form.serialize()
                },
                success: function(res) {
                    btn.removeClass('loading').prop('disabled', false);
                    if (res.success && res.data) {
                        if (res.data.thankyou_link) {
                            window.location.href = res.data.thankyou_link;
                        } else if (res.data.content) {
                            popup.find('.uwc-popup-content-right').html(res.data.content);
                            popup.find('.uwc-popup-content-left').addClass('popup_quickbuy_hidden_mobile');
                        }
                    } else {
                        var errMsg = (res.data && res.data.message) ? res.data.message : uwc_quickbuy_array.popup_error;
                        messBox.addClass('error').html(errMsg);
                    }
                },
                error: function() {
                    btn.removeClass('loading').prop('disabled', false);
                    messBox.addClass('error').html('Đặt hàng thất bại. Vui lòng kết nối lại.');
                }
            });
        });
    });
})(jQuery);

