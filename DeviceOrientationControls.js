// copy from https://github.com/mrdoob/three.js/blob/1ee2fca970e3afdc26e6c2a47c14e9e2b784ae48/examples/js/controls/DeviceOrientationControls.js
// and modified
( function () {

	const _zee = new THREE.Vector3( 0, 0, 1 );

	const _euler = new THREE.Euler();

	const _q0 = new THREE.Quaternion();

	// const _q1 = new THREE.Quaternion( - Math.sqrt( 0.5 ), 0, 0, Math.sqrt( 0.5 ) ); // - PI/2 around the x-axis


	const _changeEvent = {
		type: 'change'
	};

	class DeviceOrientationControls extends THREE.EventDispatcher {

		constructor( object ) {

			super();

			if ( window.isSecureContext === false ) {

				console.error( 'THREE.DeviceOrientationControls: DeviceOrientationEvent is only available in secure contexts (https)' );

			}

			const scope = this;
			const EPS = 0.000001;
			const lastQuaternion = new THREE.Quaternion();
			this.object = object;
			this.object.rotation.reorder( 'ZXY' );
			this.enabled = true;
			this.deviceOrientation = {};
			this.screenOrientation = 0;
			this.alphaOffset = 0; // radians

      // https://developers.google.com/web/updates/2016/03/device-orientation-changes
      const deviceOrientationEventName = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation'

			const onDeviceOrientationChangeEvent = function ( event ) {

				scope.deviceOrientation = event;

			};

			const onScreenOrientationChangeEvent = function () {

				scope.screenOrientation = window.orientation || 0;

			}; // The angles alpha, beta and gamma form a set of intrinsic Tait-Bryan angles of type Z-X'-Y''


			const setObjectQuaternion = function ( quaternion, alpha, beta, gamma, orient ) {

				_euler.set( beta, gamma, alpha, 'ZXY' );
				//_euler.set( beta, -alpha, - gamma, 'YXZ' ); // 'ZXY' for the device, but 'YXZ' for us


				quaternion.setFromEuler( _euler ); // orient the device

				// quaternion.multiply( _q1 ); // camera looks out the back of the device, not the top

				quaternion.multiply( _q0.setFromAxisAngle( _zee, - orient ) ); // adjust for screen orientation

			};

			this.connect = function () {

				onScreenOrientationChangeEvent(); // run once on load
				// iOS 13+

				if ( window.DeviceOrientationEvent !== undefined && typeof window.DeviceOrientationEvent.requestPermission === 'function' ) {

					window.DeviceOrientationEvent.requestPermission().then( function ( response ) {

						if ( response == 'granted' ) {

							window.addEventListener( 'orientationchange', onScreenOrientationChangeEvent );
							window.addEventListener( deviceOrientationEventName, onDeviceOrientationChangeEvent );

						}

					} ).catch( function ( error ) {

						console.error( 'THREE.DeviceOrientationControls: Unable to use DeviceOrientation API:', error );

					} );

				} else {

					window.addEventListener( 'orientationchange', onScreenOrientationChangeEvent );
					window.addEventListener( deviceOrientationEventName, onDeviceOrientationChangeEvent );

				}

				scope.enabled = true;

			};

			this.disconnect = function () {

				window.removeEventListener( 'orientationchange', onScreenOrientationChangeEvent );
				window.removeEventListener( deviceOrientationEventName, onDeviceOrientationChangeEvent );
				scope.enabled = false;

			};

			this.update = function () {

				if ( scope.enabled === false ) return;
				const device = scope.deviceOrientation;

				if ( device ) {

					const alpha =  "webkitCompassHeading" in device ? THREE.MathUtils.degToRad( device.webkitCompassHeading ) : (
						device.alpha ? THREE.MathUtils.degToRad( device.alpha ) + scope.alphaOffset : 0 // Z
					)

					const beta = device.beta ? THREE.MathUtils.degToRad( device.beta ) : 0; // X'

					const gamma = device.gamma ? THREE.MathUtils.degToRad( device.gamma ) : 0; // Y''

					const orient = scope.screenOrientation ? THREE.MathUtils.degToRad( scope.screenOrientation ) : 0; // O

					setObjectQuaternion( scope.object.quaternion, alpha, beta, gamma, orient );

					if ( 8 * ( 1 - lastQuaternion.dot( scope.object.quaternion ) ) > EPS ) {

						lastQuaternion.copy( scope.object.quaternion );
						scope.dispatchEvent( _changeEvent );

					}

				}

			};

			this.dispose = function () {

				scope.disconnect();

			};

			this.connect();

		}

	}

	THREE.DeviceOrientationControls = DeviceOrientationControls;

} )();