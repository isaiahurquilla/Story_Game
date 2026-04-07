import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { Link } from 'expo-router'

const index = () => {
  return (
    <View>
      <Text>index page!</Text>
      <Link href="/Scene1">
        scene page
      </Link>
    </View>
  )
}

export default index

const styles = StyleSheet.create({})