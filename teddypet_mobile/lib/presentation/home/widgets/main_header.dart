

import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';

class MainHeader extends StatelessWidget implements PreferredSizeWidget {
  const MainHeader({super.key});

  @override
  Widget build(BuildContext context) {
      return Container(
         padding: const EdgeInsets.only(top: 40, left: 20, right: 20, bottom: 20),
        decoration: const BoxDecoration(
          color: Colors.white,
          boxShadow:
            [BoxShadow(color: Colors.black12, blurRadius: 4, offset: Offset(0, 2))]
        ),

        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          
          children: [
            Text("TeddyPet",
            style: TextStyle(
              fontSize: 24,
              color: AppColors.bgLight
            ),)
          ],
        ),


      );
  }

  @override
  Size get preferredSize => const Size.fromHeight(70);

}