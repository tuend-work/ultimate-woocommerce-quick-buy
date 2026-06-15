== Những cập nhật ==

/*
* Di chuyển button mặc định vào sau nút "Thêm vào giỏ hàng" trong chi tiết sản phẩm
*/
<?php
global $devvn_quickbuy;
remove_action('woocommerce_single_product_summary', array($devvn_quickbuy, 'add_button_quick_buy'), 35);
add_action('woocommerce_after_add_to_cart_button', array($devvn_quickbuy, 'add_button_quick_buy'), 35);
?>

/*
* Xóa nút mua ngay mặc định bằng code sau
*/
Thêm vào functions.php
<?php
    global $devvn_quickbuy;
    remove_action('woocommerce_single_product_summary', array($devvn_quickbuy, 'add_button_quick_buy'), 35);
?>

Thông tin thêm [về plugin này](https://levantoan.com/san-pham/plugin-mua-hang-nhanh-cho-woocommerce-woocommerce-quick-buy/).

= 2.1.5 - 23.11.2019 =

* Format lại tên hiển thị

= 2.1.4 - 16.11.2019 =

* Fix: Chữ hoa thường trong coupon
* Chuyển Họ và tên vào First name
* Lưu thông tin của khách hàng cho các phiên mua hàng tiếp theo

= 2.1.3 - 10.07.2019 =

* Fix: Sửa lỗi hiển thị định dạng văn bản ở mục ghi chú trên popup
* Update: Cập nhật lại dấu phân cách giá theo cài đặt của woocommerce

= 2.1.2 - 18.04.2019 =

* Update: Sửa chữ số lượng kèm tên sản phẩm khi dùng Woocommerce từ bản 3.6.0

= 2.1.1 - 14.04.2019 =

* Fix: Hiển thị tổng giá tiền khi sử dụng SMS Master

= 2.1.0 - 23.03.2019 =

* Fix: Sửa lỗi khi dùng "Sticky Add to cart" trong theme Flatsome
* Update: Tương thích với plugin SMS Master
* Update: Tự động thêm thông tin user vào đơn hàng nếu đang đăng nhập

= 2.0.9.1 - 28.02.2019 =

* Fix: Sửa lại thiếu điều kiện ở bản 2.0.9 - nếu không bật phương thức thanh toán thì sẽ bị lỗi

= 2.0.9 - 22.02.2019 =
* Add: Thêm mã giảm giá (Coupon) vào form mua hàng nhanh
* Update: Thay đổi thư viện popup sang dùng Magnific Popup
* Update: Thêm được tất cả các phương thức thanh toán
* Update: Chuyển trạng thái khi mua hàng từ plugin Mua Hàng Nhanh từ processing sang on-hold với các đơn có hình thức thanh toán khác COD

= 2.0.6 - 02.01.2019 =
* Add: Thêm shortcode [devvn_quickbuy_form id="ID_SAN_PHAM"] để hiển thị form mua nhanh ở mọi nơi trên website
* Add: Thêm option xác nhận lại số điện thoại. Tránh trường hợp khách nhập sai sđt
* Update: Xóa nút mua ngay mặc định bằng code sau
        Thêm vào functions.php
        <?php
        global $devvn_quickbuy;
        remove_action('woocommerce_single_product_summary', array($devvn_quickbuy, 'add_button_quick_buy'), 35);
        ?>

= 2.0.4 - 10.12.2018 =

* Fix: Chỉnh lại option ẩn thông tin sản phẩm khi trên mobile
* Update: Bỏ hiệu ứng khi scroll chuột popup luôn ở chính giữa màn hình. Vì gây ra 1 số lỗi nhỏ trên ios

= 2.0.3 - 17.11.2018 =

* Add: Có tùy chọn để ẩn mục ghi chú đơn hàng
* Add: Có tùy chọn để ẩn mục địa chỉ
* Add: Thêm lựa chọn hình thức thanh toán. để phù hợp với google shopping (Chỉ hỗ trợ COD và BACS)
* Fix: sửa lỗi với network multisite

= 2.0.2 - 28.10.2018 =

* Add: Thêm ẩn trường email
* Update: Tương thích với "Ultimate Affiliate Pro" sửa dụng mã aff
* Fix: Cập nhật để tương thích với plugin Vietnam Shipping (ViettelPost)
* Fix: sửa 1 số lỗi nhỏ về đa ngôn ngữ

= 2.0.0 - 19.06.2018 =

* Add: Thêm nút mua hàng vào danh sách sản phẩm (product loop). Có thể mua nhanh sản phẩm bất kỳ đâu bạn thích.
* Update: Cập nhật Shortcode hiển thị nút mua hàng.
    - Shortcode dạng [devvn_quickbuy id="{ID}" button_text1="Ví dụ" button_text2 = "Ví dụ sub text" small_link="{1,0}"]
    - Bắt buộc phải có id của sản phẩm id="{ID}" ví dụ [devvn_quickbuy id="68"]
    - Có thể thay đổi chữ hiển thị bằng button_text1 và button_text2
    - Thuộc tính small_link có giá trị là 1 hoặc 0; 0 để hiển thị dạng button có style sẵn; 1 để hiển thị dạng text link đơn giản KHÔNG có style sẵn

    * Ví dụ muốn hiển thị tại 1 page nào đó hoặc tại bất kỳ đâu thì dùng shortcode như sau
        [devvn_quickbuy id="36" button_text1="Ví dụ" button_text2 = "Ví dụ sub text"]
        Hoặc
        [devvn_quickbuy id="35"]
        Hoặc dạng text link thì
        [devvn_quickbuy id="35" small_link="1"]

    * Ví dụ muốn hiển thị thêm 1 button mua nhanh ngay trong trang chi tiết sản phẩm (single product) thì dạng như sau
        [devvn_quickbuy id="36" view="0"]

    * Đối với theme Flatsome khi bạn sử dụng customizer product page thì hãy sử dụng shortcode [devvn_quickbuy] vào chỗ cần thêm


= 1.1.4 - 07.06.2018 =

* Add: Thêm tùy chọn chuyển đến trang cảm ơn khi đặt hàng xong
* Add: Auto Update bằng license

= 1.1.3 - 04.06.2018 =

* Fix: Lỗi khi thay đổi tổng khi có miễn phí vận chuyển và 1 phí vận chuyển khác
* Fix: Tỉnh thành mặc định

= 1.1.2 - 27.02.2018 =

* Update: Tương thích với plugin Woo vs GHTK - https://levantoan.com/san-pham/plugin-ket-noi-giao-hang-tiet-kiem-voi-woocommerce-ghtk-vs-woocommerce/