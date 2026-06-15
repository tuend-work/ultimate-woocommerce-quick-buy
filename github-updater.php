<?php
/**
 * GitHub Updater for Ultimate WooCommerce Quick Buy
 * Handles native WordPress update notifications and provides a manual update button.
 */

defined( 'ABSPATH' ) or die( 'No script kiddies please!' );

if ( ! class_exists( 'Uwc_Github_Updater' ) ) {
    class Uwc_Github_Updater {
        private $file;
        private $plugin_data;
        private $basename;
        private $username = 'tuend-work';
        private $repository = 'ultimate-woocommerce-quick-buy';
        private $github_response = null;

        public function __construct( $file ) {
            $this->file = $file;
            $this->basename = plugin_basename( $this->file );

            // Hook to admin_init to load plugin properties
            add_action( 'admin_init', array( $this, 'init_properties' ) );

            // AJAX action for manual update
            add_action( 'wp_ajax_uwc_github_manual_update', array( $this, 'ajax_manual_update' ) );

            return $this;
        }

        public function init_properties() {
            $this->plugin_data = get_plugin_data( $this->file );

            // Native WordPress plugin update hooks
            add_filter( 'pre_set_site_transient_update_plugins', array( $this, 'check_for_updates' ) );
            add_filter( 'plugins_api', array( $this, 'plugin_popup_info' ), 10, 3 );
            add_filter( 'upgrader_post_install', array( $this, 'post_install_rename' ), 10, 3 );
        }

        /**
         * Fetch latest release details from GitHub API
         */
        private function get_latest_github_release() {
            if ( ! is_null( $this->github_response ) ) {
                return $this->github_response;
            }

            // Fetch the raw main file from the main branch to check the version
            $url = "https://raw.githubusercontent.com/{$this->username}/{$this->repository}/main/ultimate-woocommerce-quick-buy.php";
            $args = array(
                'timeout' => 10
            );

            $request = wp_remote_get( $url, $args );

            if ( is_wp_error( $request ) ) {
                return $request;
            }

            $code = wp_remote_retrieve_response_code( $request );
            $message = wp_remote_retrieve_response_message( $request );

            if ( $code !== 200 ) {
                return new WP_Error( 'github_error', 'Không thể kết nối đến GitHub Raw (Mã lỗi: ' . $code . ' - ' . $message . '). Hãy đảm bảo kho lưu trữ ở chế độ Public.' );
            }

            $body = wp_remote_retrieve_body( $request );
            
            // Extract version from plugin headers
            if ( preg_match( '/Version:\s*([0-9.-]+)/i', $body, $matches ) ) {
                $version = trim( $matches[1] );
                
                // Construct mock release object pointing to the main branch ZIP
                $response = new stdClass();
                $response->tag_name = $version;
                $response->zipball_url = "https://github.com/{$this->username}/{$this->repository}/archive/refs/heads/main.zip";
                $response->body = "Cập nhật trực tiếp từ nhánh main trên GitHub.";
                
                $this->github_response = $response;
                return $response;
            }

            return new WP_Error( 'github_parse_error', 'Không thể đọc được phiên bản của plugin từ tệp tin trên GitHub.' );
        }

        /**
         * Inject GitHub update data into WordPress update transient
         */
        public function check_for_updates( $transient ) {
            if ( empty( $transient->checked ) ) {
                return $transient;
            }

            $release = $this->get_latest_github_release();

            if ( $release && ! is_wp_error( $release ) ) {
                $github_version = ltrim( $release->tag_name, 'v' );
                $local_version  = $this->plugin_data['Version'];

                if ( version_compare( $local_version, $github_version, '<' ) ) {
                    $obj = new stdClass();
                    $obj->slug        = $this->basename;
                    $obj->plugin      = $this->basename;
                    $obj->new_version = $github_version;
                    $obj->url         = "https://github.com/{$this->username}/{$this->repository}";
                    $obj->package     = $release->zipball_url;

                    $transient->response[ $this->basename ] = $obj;
                }
            }

            return $transient;
        }

        /**
         * Provide information for the WordPress "View details" popup modal
         */
        public function plugin_popup_info( $result, $action, $args ) {
            if ( $action !== 'plugin_information' ) {
                return $result;
            }

            if ( ! isset( $args->slug ) || $args->slug !== $this->basename ) {
                return $result;
            }

            $release = $this->get_latest_github_release();

            if ( $release && ! is_wp_error( $release ) ) {
                $github_version = ltrim( $release->tag_name, 'v' );

                $api_response = new stdClass();
                $api_response->name          = $this->plugin_data['Name'];
                $api_response->slug          = $this->basename;
                $api_response->version       = $github_version;
                $api_response->author        = $this->plugin_data['AuthorName'];
                $api_response->homepage      = $this->plugin_data['PluginURI'];
                $api_response->download_link = $release->zipball_url;
                $api_response->sections      = array(
                    'description' => $this->plugin_data['Description'],
                    'changelog'   => wp_kses_post( nl2br( $release->body ) )
                );

                return $api_response;
            }

            return $result;
        }

        /**
         * Rename the GitHub zip extraction folder to the proper plugin folder name
         */
        public function post_install_rename( $true, $hook_extra, $result ) {
            global $wp_filesystem;

            $plugin_folder = dirname( $this->basename );
            $proper_destination = WP_PLUGIN_DIR . '/' . $plugin_folder;
            $source = $result['destination'];

            // Perform moves
            $wp_filesystem->move( $source, $proper_destination );
            $result['destination'] = $proper_destination;

            // Reactivate if it was active prior to upgrade
            if ( is_plugin_active( $this->basename ) ) {
                activate_plugin( $this->basename );
            }

            return $result;
        }

        /**
         * AJAX Action: Trigger manual update from GitHub
         */
        public function ajax_manual_update() {
            // Check permission
            if ( ! current_user_can( 'update_plugins' ) ) {
                wp_send_json_error( array( 'message' => 'Bạn không có quyền thực hiện hành động này.' ) );
            }

            // Verify nonce
            check_ajax_referer( 'uwc_github_update_nonce', 'nonce' );

            $release = $this->get_latest_github_release();

            if ( is_wp_error( $release ) ) {
                wp_send_json_error( array( 'message' => 'Lỗi kết nối GitHub: ' . $release->get_error_message() ) );
            }

            $github_version = ltrim( $release->tag_name, 'v' );
            $local_version  = get_plugin_data( $this->file )['Version'];

            if ( version_compare( $local_version, $github_version, '>=' ) ) {
                wp_send_json_success( array(
                    'updated' => false,
                    'message' => 'Plugin đã ở phiên bản mới nhất (' . $local_version . '). Không cần cập nhật.'
                ) );
            }

            // Include WordPress upgrade libraries
            require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
            require_once ABSPATH . 'wp-admin/includes/file.php';
            require_once ABSPATH . 'wp-admin/includes/plugin.php';

            // Set up updater skin and transient
            $skin     = new Automatic_Upgrader_Skin();
            $upgrader = new Plugin_Upgrader( $skin );

            // Temporarily force transient update to ensure updater recognizes the source package
            $transient = get_site_transient( 'update_plugins' );
            if ( ! is_object( $transient ) ) {
                $transient = new stdClass();
            }
            
            $obj = new stdClass();
            $obj->slug        = $this->basename;
            $obj->plugin      = $this->basename;
            $obj->new_version = $github_version;
            $obj->url         = "https://github.com/{$this->username}/{$this->repository}";
            $obj->package     = $release->zipball_url;
            $transient->response[ $this->basename ] = $obj;
            set_site_transient( 'update_plugins', $transient );

            // Trigger WooCommerce Quick Buy upgrade
            $result = $upgrader->upgrade( $this->basename );

            if ( is_wp_error( $result ) ) {
                wp_send_json_error( array( 'message' => $result->get_error_message() ) );
            } elseif ( $result === false ) {
                wp_send_json_error( array( 'message' => 'Cập nhật thất bại. Vui lòng thử lại sau.' ) );
            }

            wp_send_json_success( array(
                'updated' => true,
                'message' => 'Cập nhật thành công lên phiên bản mới nhất ' . $github_version . ' từ GitHub!'
            ) );
        }

        /**
         * Render Update Button HTML in Settings Page
         */
        public static function render_update_button() {
            $plugin_file = __DIR__ . '/ultimate-woocommerce-quick-buy.php';
            $version = 'N/A';
            if ( file_exists( $plugin_file ) ) {
                $data = get_plugin_data( $plugin_file );
                $version = $data['Version'];
            }
            
            $nonce = wp_create_nonce( 'uwc_github_update_nonce' );
            ?>
            <div class="uwc-updater-wrap" style="background:#ffffff; padding:24px; border-radius:12px; border:1px solid #e2e8f0; margin-top:20px; max-width:600px;">
                <h3 style="margin-top:0; color:#0f172a; font-size:1.15rem; font-weight:700;">Cập nhật từ GitHub</h3>
                <p style="color:#64748b; font-size:0.95rem; line-height:1.5;">Phiên bản hiện tại: <strong>v<?php echo esc_html( $version ); ?></strong>. Nhấn nút dưới đây để kiểm tra và cập nhật trực tiếp phiên bản mới nhất từ kho lưu trữ GitHub.</p>
                <div style="display:flex; align-items:center; gap:16px; margin-top:16px;">
                    <button type="button" id="uwc-github-update-btn" class="button button-primary" style="background:#2563eb; border-color:#2563eb; padding:6px 16px; height:auto; font-weight:600; border-radius:6px; box-shadow:0 2px 4px rgba(37,99,235,0.15);">
                        Kiểm tra & Cập nhật
                    </button>
                    <span id="uwc-github-update-status" style="font-weight:600; font-size:0.95rem; color:#475569;"></span>
                </div>
                
                <script>
                jQuery(document).ready(function($) {
                    $('#uwc-github-update-btn').on('click', function(e) {
                        e.preventDefault();
                        var btn = $(this);
                        var status = $('#uwc-github-update-status');
                        
                        btn.prop('disabled', true).text('Đang xử lý...');
                        status.css('color', '#475569').text('Đang kết nối GitHub...');
                        
                        $.ajax({
                            url: ajaxurl,
                            type: 'POST',
                            data: {
                                action: 'uwc_github_manual_update',
                                nonce: '<?php echo esc_js( $nonce ); ?>'
                            },
                            success: function(res) {
                                if (res.success) {
                                    status.css('color', '#16a34a').text(res.data.message);
                                    if (res.data.updated) {
                                        setTimeout(function() {
                                            window.location.reload();
                                        }, 2000);
                                    } else {
                                        btn.prop('disabled', false).text('Kiểm tra & Cập nhật');
                                    }
                                } else {
                                    status.css('color', '#ef4444').text(res.data.message || 'Lỗi không xác định.');
                                    btn.prop('disabled', false).text('Kiểm tra & Cập nhật');
                                }
                            },
                            error: function() {
                                status.css('color', '#ef4444').text('Lỗi kết nối máy chủ.');
                                btn.prop('disabled', false).text('Kiểm tra & Cập nhật');
                            }
                        });
                    });
                });
                </script>
            </div>
            <?php
        }
    }
}
