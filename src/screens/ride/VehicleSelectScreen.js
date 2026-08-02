import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';

import { estimateFare, bookRide } from '../../api/rides';

const VEHICLE_LABELS = {
  bike: { label: 'Bike', icon: '🏍️' },
  auto: { label: 'Auto', icon: '🛺' },
  car_mini: { label: 'Mini Car', icon: '🚗' },
  car_sedan: { label: 'Sedan', icon: '🚘' },
};

export default function VehicleSelectScreen({ route, navigation }) {

  const { pickup, drop } = route.params || {};

  const [estimates, setEstimates] = useState([]);
  const [selected, setSelected] = useState('bike');
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);


  useEffect(() => {
    getFare();
  }, []);


  const getFare = async () => {

    if (!pickup?.lat || !pickup?.lng || !drop?.lat || !drop?.lng) {

      Alert.alert(
        "Location Error",
        "Pickup or drop location missing",
        [
          {
            text:"OK",
            onPress:()=>navigation.goBack()
          }
        ]
      );

      setLoading(false);
      return;
    }


    try {

      const res = await estimateFare(
        pickup.lat,
        pickup.lng,
        drop.lat,
        drop.lng
      );


      setEstimates(
        res?.data?.estimates ||
        res?.estimates ||
        []
      );


    } catch(error){

      console.log("FARE ERROR", error);

      Alert.alert(
        "Error",
        "Unable to calculate fare"
      );

    }
    finally{
      setLoading(false);
    }

  };



  const confirmBooking = async()=>{

    if(!pickup || !drop || !selected){

      Alert.alert(
        "Booking Error",
        "Pickup, drop and vehicle required"
      );

      return;
    }


    setBooking(true);


    try{


      const data = {

        pickup:{
          address: pickup.address || "Current Location",
          lat:Number(pickup.lat),
          lng:Number(pickup.lng)
        },


        drop:{
          address: drop.address || "Drop Location",
          lat:Number(drop.lat),
          lng:Number(drop.lng)
        },


        vehicleType:selected,

        paymentMethod:"cash"

      };


      console.log(
        "SEND BOOKING DATA",
        data
      );


      const res = await bookRide(data);


      const rideId =
        res?.data?.ride?._id ||
        res?.ride?._id;


      if(!rideId){

        Alert.alert(
          "Booking Failed",
          res?.data?.message ||
          "Ride ID not received"
        );

        return;
      }


      navigation.replace(
        "LiveRide",
        {
          rideId:rideId
        }
      );


    }
    catch(error){

      console.log(
        "BOOK ERROR",
        error?.response?.data || error
      );


      Alert.alert(
        "Booking Error",
        error?.response?.data?.message ||
        "Something went wrong"
      );

    }
    finally{

      setBooking(false);

    }

  };



  if(loading){

    return(
      <View style={styles.center}>

        <ActivityIndicator
          size="large"
          color="#1877F2"
        />

        <Text>
          Finding best fare...
        </Text>

      </View>
    );

  }



  return(

    <View style={styles.container}>


      <Text style={styles.title}>
        Choose Your Ride
      </Text>



      <FlatList

        data={estimates}

        keyExtractor={(item)=>
          item.vehicleType
        }


        renderItem={({item})=>(

          <TouchableOpacity

            style={[
              styles.card,
              selected===item.vehicleType &&
              styles.selected
            ]}


            onPress={()=>
              setSelected(item.vehicleType)
            }

          >


            <Text style={styles.icon}>

              {
                VEHICLE_LABELS[item.vehicleType]?.icon ||
                "🚕"
              }

            </Text>



            <View style={{flex:1}}>

              <Text style={styles.name}>

                {
                 VEHICLE_LABELS[item.vehicleType]?.label ||
                 item.vehicleType
                }

              </Text>


              <Text>

                {item.durationMin || 0} min

              </Text>

            </View>



            <Text style={styles.price}>

              ₹{Math.round(item.totalFare || 0)}

            </Text>


          </TouchableOpacity>

        )}

      />



      <TouchableOpacity

        style={styles.button}

        onPress={confirmBooking}

        disabled={booking}

      >

      {
        booking ?

        <ActivityIndicator color="#fff"/>

        :

        <Text style={styles.buttonText}>
          Book Ride
        </Text>

      }


      </TouchableOpacity>



    </View>

  );

}



const styles=StyleSheet.create({

container:{
flex:1,
backgroundColor:"#fff",
padding:20,
paddingTop:60
},

center:{
flex:1,
justifyContent:"center",
alignItems:"center"
},

title:{
fontSize:24,
fontWeight:"800",
marginBottom:20
},


card:{
flexDirection:"row",
alignItems:"center",
padding:18,
borderWidth:1,
borderColor:"#ddd",
borderRadius:15,
marginBottom:12
},


selected:{
borderColor:"#1877F2",
backgroundColor:"#eef6ff"
},


icon:{
fontSize:35,
marginRight:15
},


name:{
fontSize:17,
fontWeight:"700"
},


price:{
fontSize:18,
fontWeight:"800"
},


button:{
backgroundColor:"#1877F2",
padding:18,
borderRadius:15,
alignItems:"center",
marginBottom:20
},


buttonText:{
color:"#fff",
fontSize:18,
fontWeight:"700"
}

});
