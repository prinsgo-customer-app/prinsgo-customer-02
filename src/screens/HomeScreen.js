import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";

import colors from "../theme/colors";

export default function HomeScreen() {

  const services = [
    {title:"Bike", icon:"🏍️"},
    {title:"Auto", icon:"🛺"},
    {title:"Cab", icon:"🚗"},
    {title:"Parcel", icon:"📦"},
  ];

  return (
    <View style={styles.container}>

      <ScrollView>

        <View style={styles.header}>
          <Text style={styles.logo}>
            Prins<Text style={{color:colors.blue}}>Go</Text>
          </Text>

          <Text style={styles.tag}>
            Ride • Parcel • Safe • Smart
          </Text>
        </View>


        <TouchableOpacity style={styles.locationBox}>
          <Text style={styles.small}>
            Where are you going?
          </Text>

          <Text style={styles.location}>
            Search pickup location
          </Text>
        </TouchableOpacity>


        <Text style={styles.heading}>
          Choose Service
        </Text>


        <View style={styles.services}>

        {services.map((item,index)=>(
          <TouchableOpacity
          key={index}
          style={styles.card}
          >

          <Text style={styles.icon}>
            {item.icon}
          </Text>

          <Text style={styles.title}>
            {item.title}
          </Text>

          </TouchableOpacity>
        ))}

        </View>


        <View style={styles.offer}>
          <Text style={styles.offerText}>
            Special Offers Coming Soon
          </Text>
        </View>


      </ScrollView>

    </View>
  );
}


const styles = StyleSheet.create({

container:{
 flex:1,
 backgroundColor:"#fff",
 padding:20
},

header:{
 marginTop:20,
},

logo:{
 fontSize:36,
 fontWeight:"bold",
 color:colors.primary
},

tag:{
 color:"#666",
 marginTop:5
},


locationBox:{
 marginTop:30,
 padding:18,
 borderRadius:15,
 backgroundColor:"#F5F7FB"
},

small:{
 color:"#777",
 fontSize:12
},

location:{
 marginTop:8,
 fontSize:16,
 fontWeight:"600",
 color:"#333"
},


heading:{
 marginTop:30,
 fontSize:20,
 fontWeight:"bold",
},


services:{
 flexDirection:"row",
 justifyContent:"space-between",
 marginTop:20
},

card:{
 width:"23%",
 padding:15,
 borderRadius:15,
 backgroundColor:"#fff",
 elevation:3,
 alignItems:"center"
},

icon:{
 fontSize:28
},

title:{
 marginTop:8,
 fontWeight:"600"
},


offer:{
 marginTop:30,
 backgroundColor:colors.primary,
 padding:25,
 borderRadius:18
},

offerText:{
 color:"#fff",
 fontSize:18,
 fontWeight:"bold"
}

});
