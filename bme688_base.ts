
/**
 * BME688 Base Code
 */
namespace BME688 {

    ////////////////////////////////
    //          BME688            //
    ////////////////////////////////

    // Useful BME688 Register Addresses
    // Control
    const CHIP_ADDRESS = 0x77    // I2C address as determined by hardware configuration
    const CTRL_MEAS = 0x74       // Bit position <7:5>: Temperature oversampling   Bit position <4:2>: Pressure oversampling   Bit position <1:0>: Sensor power mode
    const RESET = 0xE0           // Write 0xB6 to initiate soft-reset (same effect as power-on reset)
    const CHIP_ID = 0xD0         // Read this to return the chip ID: 0x61 - good way to check communication is occurring
    const CTRL_HUM = 0x72        // Bit position <2:0>: Humidity oversampling settings
    const CONFIG = 0x75          // Bit position <4:2>: IIR filter settings
    const CTRL_GAS_0 = 0x70      // Bit position <3>: Heater off (set to '1' to turn off current injection)
    const CTRL_GAS_1 = 0x71      // Bit position <5> DATASHEET ERROR: Enable gas conversions to start when set to '1'   Bit position <3:0>: Heater step selection (0 to 9)

    // Pressure Data
    const PRESS_MSB_0 = 0x1F     // Forced & Parallel: MSB [19:12]
    const PRESS_LSB_0 = 0x20     // Forced & Parallel: LSB [11:4]
    const PRESS_XLSB_0 = 0x21    // Forced & Parallel: XLSB [3:0]

    // Temperature Data
    const TEMP_MSB_0 = 0x22      // Forced & Parallel: MSB [19:12]
    const TEMP_LSB_0 = 0x23      // Forced & Parallel: LSB [11:4]
    const TEMP_XLSB_0 = 0x24     // Forced & Parallel: XLSB [3:0]

    // Humidity Data
    const HUMID_MSB_0 = 0x25     // Forced & Parallel: MSB [15:8]
    const HUMID_LSB_0 = 0x26     // Forced & Parallel: LSB [7:0]

    // Gas Resistance Data
    const GAS_RES_MSB_0 = 0x2C   // Forced & Parallel: MSB [9:2]
    const GAS_RES_LSB_0 = 0x2D   // Forced & Parallel: Bit <7:6>: LSB [1:0]    Bit <5>: Gas valid    Bit <4>: Heater stability    Bit <3:0>: Gas resistance range

    // Status
    const MEAS_STATUS_0 = 0x1D   // Forced & Parallel: Bit <7>: New data    Bit <6>: Gas measuring    Bit <5>: Measuring    Bit <3:0>: Gas measurement index

    //The following functions are for reading the registers on the BME688
    //function for reading register as unsigned 8 bit integer
    function getUInt8BE(reg: number): number {
        pins.i2cWriteNumber(CHIP_ADDRESS, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(CHIP_ADDRESS, NumberFormat.UInt8BE);
    }

    //function for reading register as signed 8 bit integer (little endian)
    function getInt8LE(reg: number): number {
        pins.i2cWriteNumber(CHIP_ADDRESS, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(CHIP_ADDRESS, NumberFormat.Int8LE);
    }

    //function for reading register as signed 8 bit integer (big endian)
    function getInt8BE(reg: number): number {
        pins.i2cWriteNumber(CHIP_ADDRESS, reg, NumberFormat.UInt8BE);
        return pins.i2cReadNumber(CHIP_ADDRESS, NumberFormat.Int8BE);
    }

    // Function to convert unsigned ints to twos complement signed ints
    function twosComp(value: number, bits: number): number {
        if ((value & (1 << (bits - 1))) != 0) {
            value = value - (1 << bits)
        }
        return value
    }

    // Calibration parameters for compensation calculations
    let tempLSB = 0
    let tempMSB = 0
    // Temperature
    tempLSB = getUInt8BE(0xE9)
    tempMSB = getUInt8BE(0xEA)
    let PAR_T1 = twosComp((tempMSB << 8) | tempLSB, 16)      // Signed 16-bit
    tempLSB = getInt8BE(0x8A)
    tempMSB = getInt8BE(0x8B)
    let PAR_T2 = twosComp((tempMSB << 8) | tempLSB, 16)      // Signed 16-bit
    let PAR_T3 = getInt8BE(0x8C)                                 // Signed 8-bit

    // Pressure
    tempLSB = getUInt8BE(0x8E)
    tempMSB = getUInt8BE(0x8F)
    let PAR_P1 = (tempMSB << 8) | tempLSB                    // Always a positive number, do not do twosComp() conversion!
    tempLSB = getUInt8BE(0x90)
    tempMSB = getUInt8BE(0x91)
    let PAR_P2 = twosComp((tempMSB << 8) | tempLSB, 16)      // Signed 16-bit
    let PAR_P3 = getInt8BE(0x92)                                 // Signed 8-bit
    tempLSB = getUInt8BE(0x94)
    tempMSB = getUInt8BE(0x95)
    let PAR_P4 = twosComp((tempMSB << 8) | tempLSB, 16)      // Signed 16-bit
    tempLSB = getUInt8BE(0x96)
    tempMSB = getUInt8BE(0x97)
    let PAR_P5 = twosComp((tempMSB << 8) | tempLSB, 16)      // Signed 16-bit
    let PAR_P6 = getInt8BE(0x99)                                 // Signed 8-bit
    let PAR_P7 = getInt8BE(0x98)                                 // Signed 8-bit
    tempLSB = getUInt8BE(0x9C)
    tempMSB = getUInt8BE(0x9D)
    let PAR_P8 = twosComp((tempMSB << 8) | tempLSB, 16)      // Signed 16-bit
    tempLSB = getUInt8BE(0x9E)
    tempMSB = getUInt8BE(0x9F)
    let PAR_P9 = twosComp((tempMSB << 8) | tempLSB, 16)      // Signed 16-bit
    let PAR_P10 = getInt8BE(0xA0)                                // Signed 8-bit

    // Humidity
    let parH1_LSB_parH2_LSB = getUInt8BE(0xE2)
    let PAR_H1 = (getUInt8BE(0xE3) << 4) | (parH1_LSB_parH2_LSB & 0x0F)
    let PAR_H2 = (getUInt8BE(0xE1) << 4) | (parH1_LSB_parH2_LSB >> 4)
    let PAR_H3 = getInt8BE(0xE4)                                 // Signed 8-bit
    let PAR_H4 = getInt8BE(0xE5)                                 // Signed 8-bit
    let PAR_H5 = getInt8BE(0xE6)                                 // Signed 8-bit
    let PAR_H6 = getInt8BE(0xE7)                                 // Signed 8-bit
    let PAR_H7 = getInt8BE(0xE8)                                 // Signed 8-bit

    // Gas resistance
    let PAR_G1 = getInt8BE(0xED)                                 // Signed 8-bit
    tempLSB = getUInt8BE(0xEB)
    tempMSB = getUInt8BE(0xEC)
    let PAR_G2 = twosComp((tempMSB << 8) | tempLSB, 16)      // Signed 16-bit
    let PAR_G3 = getUInt8BE(0xEE)                                // Unsigned 8-bit
    let RES_HEAT_RANGE = (getUInt8BE(0x02) >> 4) & 0x03
    let RES_HEAT_VAL = twosComp(getUInt8BE(0x00), 8)              // Signed 8-bit

    // Oversampling rate constants
    const OSRS_1X = 0x01
    const OSRS_2X = 0x02
    const OSRS_4X = 0x03
    const OSRS_8X = 0x04
    const OSRS_16X = 0x05

    // IIR filter coefficient values
    const IIR_0 = 0x00
    const IIR_1 = 0x01
    const IIR_3 = 0x02
    const IIR_7 = 0x03
    const IIR_15 = 0x04
    const IIR_31 = 0x05
    const IIR_63 = 0x06
    const IIR_127 = 0x07

    //Global variables used for storing one copy of value, these are used in multiple locations for calculations
    let bme688InitFlag = false
    let gasInit = false
    let measurementsBuf = pins.createBuffer(8)
    let writeBuf = pins.createBuffer(2)

    export let temperatureReading = 0       // calculated readings of sensor parameters from raw adc readings
    export let pressureReading = 0
    export let humidityReading = 0
    export let gasResistance = 0
    export let iaqPercent = 0
    export let iaqScore = 0
    export let airQualityRating = ""
    export let eCO2Value = 0

    let gasBaseline = 0
    let humidityBaseline = 40        // Between 30% & 50% is a widely recognised optimal indoor humidity, 40% is a good middle ground
    let humidityWeighting = 0.25     // Humidity contributes 25% to the IAQ score, gas resistance is 75%
    let prevTemperature = 0
    let prevHumidity = 0
    let measureTime = 0
    let prevMeasureTime = 0

    let adcRawTemperature = 0    // adc reading of raw temperature
    let adcRawPressure = 0       // adc reading of raw pressure
    let adcRawHumidity = 0       // adc reading of raw humidity
    let adcRawGasResistance = 0  // adc reading of raw gas resistance
    let gasRange = 0

    // Compensation calculation intermediate variables (used across temperature, pressure, humidity and gas)
    let var1 = 0
    let var2 = 0
    let var3 = 0
    let var4 = 0
    let var5 = 0
    let var6 = 0

    let t_fine = 0                          // Intermediate temperature value used for pressure calculation
    export let ambientTemperature = 0       // Intermediate temperature value used for heater calculation
    let ambTempPos = 0                      // Current position of the ambTemp measurement to store in EEPROM
    let ambTempFlag = false

    // Temperature compensation calculation: rawADC to degrees C (integer)
    export function calcTemperature(tempADC: number): void {
        prevTemperature = temperatureReading

        var1 = (tempADC >> 3) - (PAR_T1 << 1)
        var2 = (var1 * PAR_T2) >> 11
        var3 = ((((var1 >> 1) * (var1 >> 1)) >> 12) * (PAR_T3 << 4)) >> 14
        t_fine = var2 + var3
        let newAmbTemp = ((t_fine * 5) + 128) >> 8
        temperatureReading = newAmbTemp / 100     // Convert to floating point with 2 dp

        // Change position in the ambPrevTemps[] array ready for next reading to be stored, overwriting the previous one in that position
        if (ambTempFlag == false) {
            if (ambTempPos < 59) {
                let newAmbTemp_H = newAmbTemp >> 8
                let newAmbTemp_L = newAmbTemp & 0xFF
                writeByte(newAmbTemp_H, ((13 * 128) + ambTempPos))
                writeByte(newAmbTemp_L, ((13 * 128) + ambTempPos + 1))
                //ambPrevTemps[ambTempPos] = newAmbTemp   // Store latest temperature in ambient temperature array
                ambTempPos++
            }
            else {
                ambTempPos = 0
                ambTempFlag = true      // Set flag to show there are now 60 previous temperature readings so the average can now be calculated
            }
        }
    }

    // Pressure compensation calculation: rawADC to Pascals (integer)
    export function intCalcPressure(pressureADC: number): void {
        var1 = (t_fine >> 1) - 64000
        var2 = ((((var1 >> 2) * (var1 >> 2)) >> 11) * PAR_P6) >> 2
        var2 = var2 + ((var1 * PAR_P5) << 1)
        var2 = (var2 >> 2) + (PAR_P4 << 16)
        var1 = (((((var1 >> 2) * (var1 >> 2)) >> 13) * (PAR_P3 << 5)) >> 3) + ((PAR_P2 * var1) >> 1)
        var1 = var1 >> 18
        var1 = ((32768 + var1) * PAR_P1) >> 15
        pressureReading = 1048576 - pressureADC
        pressureReading = ((pressureReading - (var2 >> 12)) * 3125)

        if (pressureReading >= (1 << 30)) {
            pressureReading = Math.idiv(pressureReading, var1) << 1
        }
        else {
            pressureReading = Math.idiv((pressureReading << 1), var1)
        }

        var1 = (PAR_P9 * (((pressureReading >> 3) * (pressureReading >> 3)) >> 13)) >> 12
        var2 = ((pressureReading >> 2) * PAR_P8) >> 13
        var3 = ((pressureReading >> 8) * (pressureReading >> 8) * (pressureReading >> 8) * PAR_P10) >> 17
        pressureReading = pressureReading + ((var1 + var2 + var3 + (PAR_P7 << 7)) >> 4)
    }

    // Humidity compensation calculation: rawADC to % (integer)
    // 'tempScaled' is the current reading from the Temperature sensor
    export function intCalcHumidity(humidADC: number, tempScaled: number): void {
        prevHumidity = humidityReading

        var1 = humidADC - (PAR_H1 << 4) - (Math.idiv((tempScaled * PAR_H3), 100) >> 1)
        var2 = (PAR_H2 * (Math.idiv((tempScaled * PAR_H4), 100) + Math.idiv(((tempScaled * (Math.idiv((tempScaled * PAR_H5), 100))) >> 6), 100) + ((1 << 14)))) >> 10
        var3 = var1 * var2
        var4 = ((PAR_H6 << 7) + (Math.idiv((tempScaled * PAR_H7), 100))) >> 4
        var5 = ((var3 >> 14) * (var3 >> 14)) >> 10
        var6 = (var4 * var5) >> 1
        humidityReading = (var3 + var6) >> 12
        humidityReading = (((var3 + var6) >> 10) * (1000)) >> 12
        humidityReading = Math.idiv(humidityReading, 1000)
    }

    // Gas sensor heater target temperature to target resistance calculation
    // 'ambientTemp' is reading from Temperature sensor in degC (could be averaged over a day when there is enough data?)
    // 'targetTemp' is the desired temperature of the hot plate in degC (in range 200 to 400)
    // Note: Heating duration also needs to be specified for each heating step in 'gas_wait' registers
    export function intConvertGasTargetTemp(ambientTemp: number, targetTemp: number): number {
        var1 = Math.idiv((ambientTemp * PAR_G3), 1000) << 8    // Divide by 1000 as we have ambientTemp in pre-degC format (i.e. 2500 rather than 25.00 degC)
        var2 = (PAR_G1 + 784) * Math.idiv((Math.idiv(((PAR_G2 + 154009) * targetTemp * 5), 100) + 3276800), 10)
        var3 = var1 + (var2 >> 1)
        var4 = Math.idiv(var3, (RES_HEAT_RANGE + 4))
        var5 = (131 * RES_HEAT_VAL) + 65536                 // Target heater resistance in Ohms
        let resHeatX100 = ((Math.idiv(var4, var5) - 250) * 34)
        let resHeat = Math.idiv((resHeatX100 + 50), 100)

        return resHeat
    }

    // Gas resistance compensation calculation: rawADC & range to Ohms (integer)
    export function intCalcGasResistance(gasADC: number, gasRange: number): void {
        var1 = 262144 >> gasRange
        var2 = gasADC - 512
        var2 = var2 * 3
        var2 = 4096 + var2
        let calcGasRes = Math.idiv((10000 * var1), var2)

        gasResistance = calcGasRes * 100
    }

    // Initialise the BME688, establishing communication, entering initial T, P & H oversampling rates, setup filter and do a first data reading (won't return gas)
    export function bme688Init(): void {
        // Establish communication with BME688
        writeBuf[0] = CHIP_ID
        let chipID = getUInt8BE(writeBuf[0])
        while (chipID != 0x61) {
            chipID = getUInt8BE(writeBuf[0])
        }

        // Do a soft reset
        writeBuf[0] = RESET
        writeBuf[1] = 0xB6
        pins.i2cWriteBuffer(CHIP_ADDRESS, writeBuf)
        basic.pause(1000)

        // Set mode to SLEEP MODE: CTRL_MEAS reg <1:0>
        writeBuf[0] = CTRL_MEAS
        writeBuf[1] = 0x00
        pins.i2cWriteBuffer(CHIP_ADDRESS, writeBuf)

        // Set the oversampling rates for Temperature, Pressure and Humidity
        // Humidity: CTRL_HUM bits <2:0>
        writeBuf[0] = CTRL_HUM
        writeBuf[1] = OSRS_2X
        pins.i2cWriteBuffer(CHIP_ADDRESS, writeBuf)
        // Temperature: CTRL_MEAS bits <7:5>     Pressure: CTRL_MEAS bits <4:2>    (Combine and write both in one command)
        writeBuf[0] = CTRL_MEAS
        writeBuf[1] = (OSRS_2X << 5) | (OSRS_16X << 2)
        pins.i2cWriteBuffer(CHIP_ADDRESS, writeBuf)

        // IIR Filter: CONFIG bits <4:2>
        writeBuf[0] = CONFIG
        writeBuf[1] = IIR_3 << 2
        pins.i2cWriteBuffer(CHIP_ADDRESS, writeBuf)

        // Enable gas conversion: CTRL_GAS_1 bit <5>    (although datasheet says <4> - not sure what's going on here...)
        writeBuf[0] = CTRL_GAS_1
        writeBuf[1] = 0x20    // LOOKS LIKE IT'S BIT 5 NOT BIT 4 - NOT WHAT THE DATASHEET SAYS
        pins.i2cWriteBuffer(CHIP_ADDRESS, writeBuf)

        bme688InitFlag = true

        // Do an initial data read (will only return temperature, pressure and humidity as no gas sensor parameters have been set)
        measureData()
    }

    // Setup the gas sensor (defaults are 300°C and 150ms)
    export function initGasSensor(targetTemp: number, heatDuration: number): void {
        if (bme688InitFlag == false) {
            bme688Init()
        }

        // Limit targetTemp between 200°C & 400°C
        if (targetTemp < 200) {
            targetTemp = 200
        }
        else if (targetTemp > 400) {
            targetTemp = 400
        }
        // Limit heatDuration between 0ms and 4032ms
        if (heatDuration < 0) {
            heatDuration = 0
        }
        else if (heatDuration > 4032) {
            heatDuration = 4032
        }

        // Define the target heater resistance from temperature (Heater Step 0)
        writeBuf[0] = 0x5A                                                          // res_wait_0 register - heater step 0
        writeBuf[1] = intConvertGasTargetTemp(ambientTemperature, targetTemp)
        pins.i2cWriteBuffer(CHIP_ADDRESS, writeBuf)

        // Define the heater on time, converting ms to register code (Heater Step 0) - cannot be greater than 4032ms
        // Bits <7:6> are a multiplier (1, 4, 16 or 64 times)    Bits <5:0> are 1ms steps (0 to 63ms)
        let codedDuration = 0
        if (heatDuration < 4032) {
            let factor = 0
            while (heatDuration > 63) {
                heatDuration = Math.idiv(heatDuration, 4)
                factor = factor + 1
            }
            codedDuration = heatDuration + (factor * 64)
        }
        else {
            codedDuration = 255
        }
        writeBuf[0] = 0x64                                                  // gas_wait_0 register - heater step 0
        writeBuf[1] = codedDuration
        pins.i2cWriteBuffer(CHIP_ADDRESS, writeBuf)

        // Select index of heater step (0 to 9): CTRL_GAS_1 reg <3:0>    (Make sure to combine with gas enable setting already there)
        writeBuf[0] = CTRL_GAS_1
        let gasEnable = (getUInt8BE(writeBuf[0]) & 0x20)
        writeBuf[1] = 0x00 | gasEnable                                      // Select heater step 0
        pins.i2cWriteBuffer(CHIP_ADDRESS, writeBuf)

        gasInit = true
    }

    // Run all measurements on the BME688: Temperature, Pressure, Humidity & Gas Resistance.
    export function measureData(): void {
        if (bme688InitFlag == false) {
            bme688Init()
        }

        prevMeasureTime = measureTime       // Store previous measurement time (ms since micro:bit powered on)

        // Set mode to FORCED MODE to begin single read cycle: CTRL_MEAS reg <1:0>    (Make sure to combine with temp/pressure oversampling settings already there)
        writeBuf[0] = CTRL_MEAS
        let oSampleTP = getUInt8BE(writeBuf[0])
        writeBuf[1] = 0x01 | oSampleTP
        pins.i2cWriteBuffer(CHIP_ADDRESS, writeBuf)

        // Check New Data bit to see if values have been measured: MEAS_STATUS_0 bit <7>
        writeBuf[0] = MEAS_STATUS_0
        let newData = (getUInt8BE(writeBuf[0]) & 0x80) >> 7
        while (newData != 1) {
            newData = (getUInt8BE(writeBuf[0]) & 0x80) >> 7
        }

        // Check Heater Stability Status bit to see if gas values have been measured: <4> (heater stability)
        writeBuf[0] = GAS_RES_LSB_0
        let heaterStable = (getUInt8BE(writeBuf[0]) & 0x10) >> 4

        // Temporary variables for raw to compensated value calculations
        let adcMSB = 0
        let adcLSB = 0
        let adcXLSB = 0

        // If there is new data, read temperature ADC registers(this is required for all other calculations)
        adcMSB = getUInt8BE(TEMP_MSB_0)
        adcLSB = getUInt8BE(TEMP_LSB_0)
        adcXLSB = getUInt8BE(TEMP_XLSB_0)
        adcRawTemperature = (adcMSB << 12) | (adcLSB << 4) | (adcXLSB >> 4)

        // Read pressure ADC registers
        adcMSB = getUInt8BE(PRESS_MSB_0)
        adcLSB = getUInt8BE(PRESS_LSB_0)
        adcXLSB = getUInt8BE(PRESS_XLSB_0)
        adcRawPressure = (adcMSB << 12) | (adcLSB << 4) | (adcXLSB >> 4)

        // Read humidity ADC registers
        adcMSB = getUInt8BE(HUMID_MSB_0)
        adcLSB = getUInt8BE(HUMID_LSB_0)
        adcRawHumidity = (adcMSB << 8) | adcLSB

        // Read gas resistance ADC registers
        adcMSB = getUInt8BE(GAS_RES_MSB_0)
        adcLSB = getUInt8BE(GAS_RES_LSB_0) >> 6           // Shift bits <7:6> right to get LSB for gas resistance
        adcRawGasResistance = (adcMSB << 2) | adcLSB

        gasRange = getUInt8BE(GAS_RES_LSB_0) & 0x0F

        measureTime = control.millis()      // Capture latest measurement time (ms since micro:bit powered on)

        // Calculate the compensated reading values from the the raw ADC data
        calcTemperature(adcRawTemperature)
        intCalcPressure(adcRawPressure)
        intCalcHumidity(adcRawHumidity, temperatureReading)
        intCalcGasResistance(adcRawGasResistance, gasRange)
    }

    // A baseline gas resistance is required for the IAQ calculation - it should be taken in a well ventilated area without obvious air pollutants
    // Take 60 readings over a ~5min period and find the mean
    // These values are required for air quality calculations
    export function calcBaselines(): void {
        if (bme688InitFlag == false) {
            bme688Init()
        }
        if (gasInit == false) {
            setupGasSensor(300, 150)
        }

        ambTempFlag = false

        let burnInReadings = 0
        let burnInData = 0
        let progress = 0
        //drawRect(102, 7, 12, 50)
        while (burnInReadings < 60) {               // Measure data and continue summing gas resistance until 60 readings have been taken
            progress = Math.round((burnInReadings / 60) * 100)
            measureData()
            //clearLine(4)
            //show("Setting baselines.", 4, ShowAlign.Centre)
            //show("" + progress + " %", 6, ShowAlign.Centre)
            //drawLine(LineDirectionSelection.horizontal, progress, 13, 51)
            //drawLine(LineDirectionSelection.horizontal, progress, 13, 52)
            //drawLine(LineDirectionSelection.horizontal, progress, 13, 53)
            //drawLine(LineDirectionSelection.horizontal, progress, 13, 54)
            //drawLine(LineDirectionSelection.horizontal, progress, 13, 55)
            //basic.pause(500)
            //show("Setting baselines..", 4, ShowAlign.Centre)
            //basic.pause(500)
            //show("Setting baselines...", 4, ShowAlign.Centre)
            //basic.pause(500)
            //show("Setting baselines....", 4, ShowAlign.Centre)
            //basic.pause(500)
            //show("Setting baselines.....", 4, ShowAlign.Centre)
            burnInData = burnInData + gasResistance
            basic.pause(5000)
            burnInReadings++
        }
        gasBaseline = (burnInData / 60)             // Find the mean gas resistance during the period to form the baseline

        if (ambTempFlag) {
            let ambTotal = 0
            for (let i = 0; i < (ambTempPos + 1); i++) {
                let ambTempVal = (readByte((13 * 128) + i) << 8) | (readByte((13 * 128) + i + 1))
                ambTotal += ambTempVal
                //ambTotal += ambPrevTemps[i]
            }
            ambientTemperature = Math.trunc(ambTotal / (ambTempPos + 1))    // Calculate the ambient temperature as the mean of the 60 initial readings
        }

        //clearLine(4)
        //show("Setup Complete!", 4, ShowAlign.Centre)
        //basic.pause(2000)
        //clear()
    }

    // Calculate the Index of Air Quality score from the current gas resistance and humidity readings
    // iaqPercent: 0 to 100% - higher value = better air quality
    // iaqScore: 25 should correspond to 'typically good' air, 250 to 'typically polluted' air
    // airQualityRating: Text output based on the iaqScore
    export function calcIAQ(): void {
        let humidityScore = 0
        let gasScore = 0
        let gasOffset = gasBaseline - gasResistance                     // Calculate the gas offset from the baseline reading
        let humidityOffset = humidityReading - humidityBaseline         // Calculate the humidity offset from the baseline setting

        if (humidityOffset > 0) {                                       // Different paths for calculating the humidity score depending on whether the offset is greater than 0
            humidityScore = (100 - humidityBaseline - humidityOffset)
            humidityScore = humidityScore / (100 - humidityBaseline)
        }
        else {
            humidityScore = (humidityBaseline + humidityOffset)
            humidityScore = humidityScore / humidityBaseline
        }
        humidityScore = humidityScore * (humidityWeighting * 100)

        if (gasOffset > 0) {                                            // Different paths for calculating the gas score depending on whether the offset is greater than 0
            gasScore = gasResistance / gasBaseline
            gasScore = gasScore * (100 - (humidityWeighting * 100))
        }
        else {
            // Make sure that when gasOffset and humidityOffset are 0, iaqPercent is 95% - leaves room for cleaner air to be identified
            gasScore = Math.round(70 + (5 * ((gasResistance / gasBaseline) - 1)))
            if (gasScore > 75) {
                gasScore = 75
            }
        }

        iaqPercent = Math.trunc(humidityScore + gasScore)               // Air quality percentage is the sum of the humidity (25% weighting) and gas (75% weighting) scores
        iaqScore = (100 - iaqPercent) * 5                               // Final air quality score is in range 0 - 500 (see BME688 datasheet page 11 for details)

        if (iaqScore <= 50) {
            airQualityRating = "Excellent"
        }
        else if ((iaqScore > 50) && (iaqScore <= 100)) {
            airQualityRating = "Good"
        }
        else if ((iaqScore > 100) && (iaqScore <= 150)) {
            airQualityRating = "Lightly Polluted"
        }
        else if ((iaqScore > 150) && (iaqScore <= 200)) {
            airQualityRating = "Moderately Polluted"
        }
        else if ((iaqScore > 200) && (iaqScore <= 250)) {
            airQualityRating = "Heavily Polluted"
        }
        else if ((iaqScore > 250) && (iaqScore <= 350)) {
            airQualityRating = "Severely Polluted"
        }
        else if (iaqScore > 350) {
            airQualityRating = "Extremely Polluted"
        }
    }

    function mapValue(val: number, frLow: number, frHigh: number, toLow: number, toHigh: number): number {
        let mappedVal = toLow + (((val - frLow) / (frHigh - frLow)) * (toHigh - toLow))
        return mappedVal
    }

    // Calculate the estimated CO2 value (eCO2)
    export function calcCO2(): void {
        let eCO2Baseline = 400      // 400ppm is a typical minimum value for occupied indoor spaces with good airflow
        let humidityOffset = humidityReading - humidityBaseline             // Calculate the humidity offset from the baseline setting
        let temperatureOffset = temperatureReading - ambientTemperature     // Calculate the temperature offset from the ambient temperature

        if (iaqScore == 25) {
            eCO2Value = 400
            return
        }

        if (iaqScore < 25) {
            // eCO2 in range 250-400ppm
            //eCO2Value = Math.trunc(Math.map(iaqScore, 0, 24, 250, 399))
            eCO2Value = mapValue(iaqScore, 0, 24, 250, 399)
        }
        else if (iaqScore < 101) {
            // eCO2 in range 400-1000ppm
            //eCO2Value = Math.trunc(Math.map(iaqScore, 25, 100, 400, 1000))
            eCO2Value = mapValue(iaqScore, 25, 100, 400, 1000)
        }
        else if (iaqScore < 151) {
            // eCO2 in range 1000-2000ppm
            //eCO2Value = Math.trunc(Math.map(iaqScore, 101, 150, 1001, 2000))
            eCO2Value = mapValue(iaqScore, 101, 150, 1001, 2000)
        }
        else if (iaqScore < 201) {
            // eCO2 in range 2000-3500ppm
            //eCO2Value = Math.trunc(Math.map(iaqScore, 151, 200, 2001, 3500))
            eCO2Value = mapValue(iaqScore, 151, 200, 2001, 3500)
        }
        else if (iaqScore < 351) {
            // eCO2 in range 3500-5000ppm
            //eCO2Value = Math.trunc(Math.map(iaqScore, 201, 350, 3501, 5000))
            eCO2Value = mapValue(iaqScore, 201, 350, 3501, 5000)
        }
        else if (iaqScore < 450) {
            // eCO2 > eCO2 in range 5000-40000ppm
            //eCO2Value = Math.trunc(Math.map(iaqScore, 351, 450, 5001, 40000))
            eCO2Value = mapValue(iaqScore, 351, 450, 5001, 40000)
        }
        else if (iaqScore > 450) {
            // eCO2 > 40000ppm
            //eCO2Value = Math.trunc(Math.map(iaqScore, 451, 500, 40001, 100000))
            eCO2Value = mapValue(iaqScore, 451, 500, 40001, 100000)
        }

        eCO2Value = Math.trunc(eCO2Value)

        let humidityFactor = 0
        let temperatureFactor = 0
        let combinedFactor = 0
        // Adjust eCO2Value for humidity greater than the baseline (40%)
        if ((humidityOffset > 0) && (temperatureOffset > 0)) {
            humidityFactor = ((humidityReading - humidityBaseline) / humidityBaseline)
            temperatureFactor = ((temperatureReading - ambientTemperature) / ambientTemperature)
            combinedFactor = 1 + humidityFactor + temperatureFactor
            eCO2Value = Math.trunc(eCO2Value * combinedFactor)
        }
        else if (humidityOffset > 0) {
            eCO2Value = Math.trunc(eCO2Value * (((humidityReading - humidityBaseline) / humidityBaseline) + 1))
        }
        else if (temperatureOffset > 0) {
            eCO2Value = Math.trunc(eCO2Value * (((temperatureReading - ambientTemperature) / ambientTemperature) + 1))
        }

        // If measurements are taking place rapidly, breath detection is possible due to the sudden increase in humidity (~7-10%)
        // If this increase happens within a 2000ms time window, 1200ppm is added to the eCO2 value
        // (These values were based on 'breath-testing' with another eCO2 sensor with algorithms built-in)
        if ((measureTime - prevMeasureTime) <= 5000) {
            if ((humidityReading - prevHumidity) >= 3) {
                eCO2Value = Math.trunc(eCO2Value + 1500)
            }
        }
    }
}
